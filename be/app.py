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

from sources import JsonSource, Source

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

# Source registry — entity's "source" key in the DSL picks one of these.
# Client data file lives next to its entities.py.
SOURCES: Dict[str, Source] = {
    "json": JsonSource(CLIENT_DIR / "data.json", entities),
}

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
    return SOURCES[entities[entity].get("source", "json")]


@app.get("/")
def root():
    return {"ok": True, "service": f"{CLIENT_NAME}-entity-api", "entities": ENTITIES_ORDER}


def _client_config() -> Dict[str, Any]:
    f = CLIENT_DIR / "configuration.json"
    return json.loads(f.read_text()) if f.exists() else {}


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


@app.get("/api/entities")
def list_entities():
    return {"entities": ENTITIES_ORDER}


@app.get("/api/{entity}/options/")
def options(entity: str, schema: str = "basic"):
    if entity not in entities:
        raise HTTPException(404, f"Unknown entity: {entity}")
    cfg = entities[entity]
    return {
        "entity": entity,
        "name": entity,
        "schema": {"fields": cfg["fields"], **({"ui": cfg.get("ui", {})} if schema == "full" else {})},
        "content": cfg.get("ui", {}),
    }


@app.get("/api/{entity}/")
def list_items(entity: str, request: Request, response: Response):
    response.headers["X-Data-Source"] = _src(entity).name
    return _src(entity).list(entity, request.query_params)


@app.get("/api/{entity}/{item_id}/")
def get_item(entity: str, item_id: int):
    return _src(entity).get(entity, item_id)


@app.post("/api/{entity}/")
async def create_item(entity: str, request: Request):
    payload: Dict[str, Any] = await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(400, "JSON body must be an object")
    return _src(entity).create(entity, payload)


@app.put("/api/{entity}/{item_id}/")
async def update_item(entity: str, item_id: int, request: Request):
    return _src(entity).update(entity, item_id, await request.json())


@app.delete("/api/{entity}/{item_id}")
@app.delete("/api/{entity}/{item_id}/")
def delete_item(entity: str, item_id: int):
    return _src(entity).delete(entity, item_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
