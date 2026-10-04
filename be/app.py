# be/app.py
# Generic entity service — nishify contract, lightweight.
# Common for ALL clients: CLIENT_NAME picks be/client/<name>/entities.py.
#   GET    /api/{entity}/options/?schema=basic|full
#   GET    /api/{entity}/?q=&page=&size=&sort=&field__op=
#   GET    /api/{entity}/{id}/
#   POST   /api/{entity}/
#   PUT    /api/{entity}/{id}/
#   DELETE /api/{entity}/{id}
# Routes are generic over entities; each entity resolves to a Source
# (everything is a source — implementation is secondary).
from __future__ import annotations

import base64
import hashlib
import hmac
import importlib.util
import json
import os
import time
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from sources import HttpSource, JsonSource, Source, SqliteSource
from ui_gen import derive_ui

BASE_DIR = Path(__file__).parent
CLIENT_NAME = os.environ.get("CLIENT_NAME", "hello")
CLIENT_DIR = BASE_DIR / "client" / CLIENT_NAME


def _load_client_entities(client_dir: Path):
    """Load a client's entities.py — the only per-client file."""
    spec = importlib.util.spec_from_file_location(
        f"client_{client_dir.name}_entities", client_dir / "entities.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.entities, mod.ENTITIES_ORDER


entities, ENTITIES_ORDER = _load_client_entities(CLIENT_DIR)


def _client_config() -> Dict[str, Any]:
    f = CLIENT_DIR / "configuration.json"
    return json.loads(f.read_text()) if f.exists() else {}


_CONFIG = _client_config()

# ---------------------------------------------------------------------------
# Named data sources — "db selection per business requirement".
#
# be/client/<name>/datasources.json declares named sources:
#   {"json":  {"kind": "json",   "path": "data.json"},
#    "shop":  {"kind": "sqlite", "path": "shop.db"},
#    "crm":   {"kind": "http",   "base_url": "https://api.example.com",
#              "headers": {"Authorization": "Bearer ..."}}}
# An entity's DSL "source" key names one entry; absent file → a single
# "json" source on data.json (old behaviour preserved).
# ---------------------------------------------------------------------------


def _mk_json(cfg: Dict[str, Any]) -> Source:
    return JsonSource(CLIENT_DIR / cfg.get("path", "data.json"), entities)


def _mk_sqlite(cfg: Dict[str, Any]) -> Source:
    return SqliteSource(CLIENT_DIR / cfg.get("path", "data.db"), entities)


def _mk_http(cfg: Dict[str, Any]) -> Source:
    return HttpSource(cfg["base_url"], cfg.get("headers"))


KIND_FACTORIES = {"json": _mk_json, "sqlite": _mk_sqlite, "http": _mk_http}


def _load_sources() -> Dict[str, Source]:
    f = CLIENT_DIR / "datasources.json"
    declared = json.loads(f.read_text()) if f.exists() else {
        "json": {"kind": "json", "path": "data.json"},
    }
    out: Dict[str, Source] = {}
    for name, cfg in declared.items():
        factory = KIND_FACTORIES.get(cfg.get("kind", "json"))
        if factory is None:
            raise RuntimeError(
                f"{CLIENT_NAME}: unknown source kind {cfg.get('kind')!r} "
                f"for source {name!r} (kinds: {sorted(KIND_FACTORIES)})")
        out[name] = factory(cfg)
    return out


SOURCES: Dict[str, Source] = _load_sources()

app = FastAPI(title=f"{CLIENT_NAME} entity service", redirect_slashes=False)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in
                   os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _src(entity: str) -> Source:
    if entity not in entities:
        raise HTTPException(404, f"Unknown entity: {entity}")
    name = entities[entity].get("source") or next(iter(SOURCES))
    if name not in SOURCES:
        raise HTTPException(500, f"Entity '{entity}' uses undeclared source '{name}'")
    return SOURCES[name]


# ---------------------------------------------------------------------------
# RBAC — config-driven, enforced server-side on the entity surface.
#
#   configuration.json "roles": ["anonymous", "viewer", "admin"]
#     (list of names, or objects {"name": ..., "default": true})
#   entities.py per-entity "rbac": {"read": "*", "write": ["admin"]}
#     absent → fully open (back-compat); "*" → any role incl. anonymous.
# The Bearer token's `role` claim decides; no token → the default role.
# Tokens are HS256-signed (JWT_SECRET env, dev fallback) and expiry-checked
# — unsigned/forged/expired tokens yield no claims → default role.
# ---------------------------------------------------------------------------

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_TTL = int(os.environ.get("JWT_TTL", "86400"))


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64d(s: str):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _jwt_sign(payload: Dict[str, Any]) -> str:
    head = _b64e(json.dumps({"alg": "HS256", "typ": "JWT"},
                           separators=(",", ":")).encode())
    body = _b64e(json.dumps(payload, separators=(",", ":"), default=str).encode())
    sig = hmac.new(JWT_SECRET.encode(), f"{head}.{body}".encode(),
                   hashlib.sha256).digest()
    return f"{head}.{body}.{_b64e(sig)}"


def _jwt_verify(token: str) -> Dict[str, Any]:
    try:
        head, body, sig = token.split(".")
        expect = _b64e(hmac.new(JWT_SECRET.encode(), f"{head}.{body}".encode(),
                                hashlib.sha256).digest())
        if not hmac.compare_digest(expect, sig):
            return {}
        claims = json.loads(_b64d(body))
        if claims.get("exp") and claims["exp"] < time.time():
            return {}
        return claims
    except Exception:
        return {}


def _decode_claims(request: Request) -> Dict[str, Any]:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return {}
    return _jwt_verify(auth.split(None, 1)[1])


def _roles() -> Dict[str, Any]:
    roles = _CONFIG.get("roles") or []
    out: Dict[str, Any] = {}
    for r in roles:
        if isinstance(r, str):
            out[r] = {}
        elif isinstance(r, dict) and r.get("name"):
            out[r["name"]] = r
    return out


def _default_role() -> str:
    roles = _roles()
    for name, r in roles.items():
        if r.get("default"):
            return name
    return next(iter(roles), "anonymous")


def _role(request: Request) -> str:
    return _decode_claims(request).get("role") or _default_role()


def _check_rbac(entity: str, action: str, request: Request) -> None:
    spec = entities.get(entity, {}).get("rbac")
    if not spec:
        return
    allowed = spec.get(action, "*")
    if allowed == "*":
        return
    role = _role(request)
    if role not in (allowed if isinstance(allowed, list) else [allowed]):
        raise HTTPException(403, f"Role '{role}' cannot {action} '{entity}'")


# ---------------------------------------------------------------------------
# Row-level rule filters — per-client, per-role mandatory scopes.
#
#   entities.py per-entity "filter":
#     {"viewer": {"status__eq": "active"},   # role → forced query params
#      "*":      {"region__eq": "west"}}     # "*" applies to every role
#   Rules MERGE over caller params (caller cannot escape the scope) and
#   compose per role: "*" + <role> both apply.
# ---------------------------------------------------------------------------


def _scope(entity: str, request: Request) -> Dict[str, str]:
    rules = entities.get(entity, {}).get("filter") or {}
    role = _role(request)
    out: Dict[str, str] = {}
    if isinstance(rules.get("*"), dict):
        out.update(rules["*"])
    if isinstance(rules.get(role), dict):
        out.update(rules[role])
    return out


def _scoped_params(entity: str, request: Request):
    scope = _scope(entity, request)
    if not scope:
        return request.query_params
    import urllib.parse
    from starlette.datastructures import QueryParams
    merged = {**dict(request.query_params.multi_items()), **scope}
    return QueryParams(urllib.parse.urlencode(merged))


def _cmp(val: str, op: str, want: str) -> bool:
    """Scope-op semantics shared by list gating — numeric compare when both
    sides parse, else string compare."""
    num = None
    try:
        num = (float(val), float(want))
    except (TypeError, ValueError):
        pass
    if op == "eq":
        return val == want
    if op == "ne":
        return val != want
    if op == "in":
        return val in [x.strip() for x in want.split(",")]
    if op == "nin":
        return val not in [x.strip() for x in want.split(",")]
    if op == "contains":
        return want in val
    if num is not None:
        if op == "gt":
            return num[0] > num[1]
        if op == "gte":
            return num[0] >= num[1]
        if op == "lt":
            return num[0] < num[1]
        if op == "lte":
            return num[0] <= num[1]
    return True


def _in_scope(entity: str, request: Request, row: Dict[str, Any]) -> bool:
    for key, want in _scope(entity, request).items():
        field, _, op = key.partition("__")
        if not _cmp(str(row.get(field)).lower(), op or "eq", str(want).lower()):
            return False
    return True


# ---------------------------------------------------------------------------
# Field-level RBAC — per-entity "field_acl": {role|*: [hidden field names]}.
# Hidden fields are stripped from list/get/create/update responses and from
# the OPTIONS UI schema (columns + form fields + schema.fields). Scope and
# RBAC still see them — a hidden field may legitimately drive a filter.
# ---------------------------------------------------------------------------


def _hidden_fields(entity: str, request: Request) -> set:
    acl = entities.get(entity, {}).get("field_acl") or {}
    role = _role(request)
    return set(acl.get("*") or ()) | set(acl.get(role) or ())


def _strip_fields(row: Dict[str, Any], hidden: set) -> Dict[str, Any]:
    return {k: v for k, v in row.items() if k not in hidden} if hidden else row


def _strip_page(page: Dict[str, Any], hidden: set) -> Dict[str, Any]:
    if not hidden:
        return page
    return {**page, "items": [_strip_fields(r, hidden) for r in page.get("items", [])]}


@app.get("/")
def root():
    return {"ok": True, "service": f"{CLIENT_NAME}-entity-api", "entities": ENTITIES_ORDER}


@app.get("/api/configuration")
def configuration():
    """Client configuration — menus, theme list, sessions, pages."""
    return _client_config()


@app.get("/api/style-config/{name}")
def style_config(name: str):
    sc = _client_config().get("style-configs", {}).get(name)
    if sc is None:
        raise HTTPException(404, f"Unknown style-config: {name}")
    return sc


@app.get("/api/pages/{slug}")
def page(slug: str):
    p = _client_config().get("pages", {}).get(slug)
    if p is None:
        raise HTTPException(404, f"Unknown page: {slug}")
    return p


@app.get("/api/translations")
@app.get("/api/translations/")
def translations():
    """UI string map for the active language — flat {key: text} from
    configuration.translations (empty dict until a client defines it)."""
    return _client_config().get("translations", {})


@app.get("/api/entities")
def list_entities():
    return {"entities": ENTITIES_ORDER}


@app.post("/api/login")
@app.post("/api/login/")
async def login(request: Request):
    """Generic login — mints an HS256-signed JWT carrying the claims the
    frontend reads (sub/email/role/exp). Real auth plugs in at the same
    contract: POST → {token, user}."""
    body = await request.json()
    email = (body or {}).get("email") or (body or {}).get("username") or "user@local"
    # Role claim — body selects one of configuration.roles (rejected if
    # undeclared); no selection → the default role. RBAC reads this claim.
    role = (body or {}).get("role")
    declared = _roles()
    if role and role not in declared:
        raise HTTPException(400, f"Unknown role: {role} (roles: {sorted(declared)})")
    payload = {"sub": email, "email": email, "role": role or _default_role(),
               "iat": int(time.time()), "exp": int(time.time()) + JWT_TTL}
    return {"token": _jwt_sign(payload), "user": {"email": email, "name": email.split("@")[0]}}


@app.get("/api/_search")
@app.get("/api/_search/")
def federated_search(q: str = "", size: int = 5):
    """Federated substring search across all declared entities —
    {entity: [items]} for entities with a hit. Client-agnostic."""
    q = (q or "").strip().lower()
    if not q:
        return {"items": {}, "total": 0}
    hits: Dict[str, Any] = {}
    total = 0
    from starlette.datastructures import QueryParams
    for entity in ENTITIES_ORDER:
        try:
            rows = _src(entity).list(entity, QueryParams("size=1000")).get("items", [])
        except Exception:
            continue
        matched = [
            r for r in rows
            if any(q in str(v).lower() for v in r.values() if isinstance(v, (str, int, float)))
        ][:size]
        if matched:
            hits[entity] = matched
            total += len(matched)
    return {"items": hits, "total": total}


@app.get("/api/{entity}/options/")
def options(entity: str, schema: str = "basic", request: Request = None):
    if request is not None:
        _check_rbac(entity, "read", request)
    if entity not in entities:
        raise HTTPException(404, f"Unknown entity: {entity}")
    cfg = entities[entity]
    hidden = _hidden_fields(entity, request) if request is not None else set()
    # Explicit cfg["ui"] wins per-section; anything missing is derived
    # from the field DSL — a zero-config entity still gets a CRUD screen.
    ui = derive_ui(cfg)
    if hidden:
        table = dict(ui.get("table") or {})
        if table.get("columns"):
            table["columns"] = [c for c in table["columns"] if c.get("key") not in hidden]
            ui["table"] = table
        form = dict(ui.get("form") or {})
        if form.get("fields"):
            form["fields"] = [f for f in form["fields"] if f.get("name") not in hidden]
            ui["form"] = form
    # The entity's own rbac spec rides along in content — the FE gates
    # buttons/calls on it (useEntity can()); enforcement stays here.
    if cfg.get("rbac"):
        ui["rbac"] = cfg["rbac"]
    return {
        "entity": entity,
        "name": entity,
        "schema": {"fields": {k: v for k, v in cfg["fields"].items() if k not in hidden},
                   **({"ui": ui} if schema == "full" else {})},
        "content": ui,
        # Optional full Definition[] — a custom admin screen. When present the
        # frontend renders these defs (resolved via the admin component map)
        # instead of the synthesized default-admin grid.
        **({"config": cfg["config"]} if cfg.get("config") else {}),
    }


@app.get("/api/{entity}/")
def list_items(entity: str, request: Request, response: Response):
    _check_rbac(entity, "read", request)
    src = _src(entity)
    response.headers["X-Data-Source"] = f"{entities[entity].get('source', 'json')}:{src.name}"
    return _strip_page(src.list(entity, _scoped_params(entity, request)),
                       _hidden_fields(entity, request))


def _get_scoped(entity: str, item_id: int, request: Request) -> Dict[str, Any]:
    row = _src(entity).get(entity, item_id)
    if not _in_scope(entity, request, row):
        raise HTTPException(404, f"{entity}/{item_id} not found")
    return row


@app.get("/api/{entity}/{item_id}/")
def get_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "read", request)
    return _strip_fields(_get_scoped(entity, item_id, request),
                         _hidden_fields(entity, request))


@app.post("/api/{entity}/")
async def create_item(entity: str, request: Request):
    _check_rbac(entity, "write", request)
    payload: Dict[str, Any] = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(400, "JSON body must be an object")
    return _strip_fields(_src(entity).create(entity, payload),
                         _hidden_fields(entity, request))


@app.put("/api/{entity}/{item_id}/")
async def update_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "write", request)
    _get_scoped(entity, item_id, request)
    return _strip_fields(_src(entity).update(entity, item_id, await request.json()),
                         _hidden_fields(entity, request))


@app.delete("/api/{entity}/{item_id}")
@app.delete("/api/{entity}/{item_id}/")
def delete_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "write", request)
    _get_scoped(entity, item_id, request)
    return _src(entity).delete(entity, item_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
