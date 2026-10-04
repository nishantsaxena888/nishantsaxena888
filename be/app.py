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

import importlib.util
import json
import os
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from sources import HttpSource, JsonSource, Source, SqliteSource

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
    allow_origins=["*"],
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
# Dev tokens are unsigned — decoding claims matches the frontend contract;
# plug a real verifier at the same seam when a client adds real auth.
# ---------------------------------------------------------------------------


def _decode_claims(request: Request) -> Dict[str, Any]:
    import base64
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return {}
    try:
        payload = auth.split()[1].split(".")[1]
        pad = "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload + pad))
    except Exception:
        return {}


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


def _dev_jwt(payload: Dict[str, Any]) -> str:
    """Unsigned JWT — the frontend only decodes claims (jwt-decode);
    signing is unnecessary for the dev/source-driven model. Swap for a
    real signer when a client adds real auth."""
    import base64, json as _json
    def b64(o): return base64.urlsafe_b64encode(_json.dumps(o).encode()).rstrip(b"=").decode()
    return f"{b64({'alg': 'none', 'typ': 'JWT'})}.{b64(payload)}.dev"


@app.post("/api/login")
@app.post("/api/login/")
async def login(request: Request):
    """Generic login — any credentials mint a dev token carrying the
    claims the frontend reads (sub/email/exp). Real auth plugs in at the
    same contract: POST → {token, user}."""
    body = await request.json()
    email = (body or {}).get("email") or (body or {}).get("username") or "user@local"
    # Role claim — body selects one of configuration.roles (rejected if
    # undeclared); no selection → the default role. RBAC reads this claim.
    role = (body or {}).get("role")
    declared = _roles()
    if role and role not in declared:
        raise HTTPException(400, f"Unknown role: {role} (roles: {sorted(declared)})")
    import time
    payload = {"sub": email, "email": email, "role": role or _default_role(),
               "exp": int(time.time()) + 86400}
    return {"token": _dev_jwt(payload), "user": {"email": email, "name": email.split("@")[0]}}


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
    return {
        "entity": entity,
        "name": entity,
        "schema": {"fields": cfg["fields"], **({"ui": cfg.get("ui", {})} if schema == "full" else {})},
        "content": cfg.get("ui", {}),
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
    return src.list(entity, request.query_params)


@app.get("/api/{entity}/{item_id}/")
def get_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "read", request)
    return _src(entity).get(entity, item_id)


@app.post("/api/{entity}/")
async def create_item(entity: str, request: Request):
    _check_rbac(entity, "write", request)
    payload: Dict[str, Any] = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(400, "JSON body must be an object")
    return _src(entity).create(entity, payload)


@app.put("/api/{entity}/{item_id}/")
async def update_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "write", request)
    return _src(entity).update(entity, item_id, await request.json())


@app.delete("/api/{entity}/{item_id}")
@app.delete("/api/{entity}/{item_id}/")
def delete_item(entity: str, item_id: int, request: Request):
    _check_rbac(entity, "write", request)
    return _src(entity).delete(entity, item_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
