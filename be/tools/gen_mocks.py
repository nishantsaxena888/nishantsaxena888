#!/usr/bin/env python3
# be/tools/gen_mocks.py — generate a client's frontend mock tree from its
# backend definition. Run:  python be/tools/gen_mocks.py <client> [<client>...]
#
# Emits:
#   fe/client/<name>/mock/config.json              — endpoint registry
#   fe/client/<name>/mock/en/<endpoint>/<METHOD>/success.json
#
# Everything is flagged mock:true — the client runs with NO backend.
# Regenerate after changing entities.py / configuration.json. Delete the
# mock/ folder or flip "mock" flags to false when the real API takes over.
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

BE_DIR = Path(__file__).resolve().parents[1]
FE_CLIENT = BE_DIR.parent / "fe" / "client"
METHODS = ("GET", "OPTIONS", "POST", "PUT", "DELETE")


def load_entities(client_dir: Path):
    spec = importlib.util.spec_from_file_location("e", client_dir / "entities.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.entities, mod.ENTITIES_ORDER


def write(root: Path, rel: str, obj):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2) + "\n")


def gen_client(name: str):
    client_dir = BE_DIR / "client" / name
    out = FE_CLIENT / name / "mock"
    entities, order = load_entities(client_dir)
    cfg = json.loads((client_dir / "configuration.json").read_text())

    registry = {}

    def flag(endpoint, methods=METHODS):
        registry.setdefault(endpoint, {}).update({m: {"mock": True} for m in methods})

    # configuration + pages + style-configs
    flag("configuration")
    write(out, "en/configuration/GET/success.json", cfg)

    for slug, page_def in cfg.get("pages", {}).items():
        ep = f"pages/{slug}"
        flag(ep)
        write(out, f"en/{ep}/GET/success.json", page_def)

    for theme, style in cfg.get("style-configs", {}).items():
        ep = f"style-config/{theme}"
        flag(ep)
        write(out, f"en/{ep}/GET/success.json", style)

    # entities — list + options + write stubs
    for entity in order:
        spec = entities[entity]
        flag(entity)
        rows = list(spec.get("sample_data") or [])
        write(out, f"en/{entity}/GET/success.json",
              {"items": rows, "page": 1, "size": len(rows) or 20, "total": len(rows)})
        write(out, f"en/{entity}/OPTIONS/success.json", {
            "entity": entity, "name": entity,
            "schema": {"fields": spec["fields"], "ui": spec.get("ui", {})},
            "content": spec.get("ui", {}),
        })
        for m in ("POST", "PUT", "DELETE"):
            write(out, f"en/{entity}/{m}/success.json", {"ok": True, "mock": True})

    write(out, "config.json", registry)
    print(f"{name}: {len(registry)} endpoints flagged mock:true → fe/client/{name}/mock/")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python be/tools/gen_mocks.py <client> [<client>...]")
        sys.exit(1)
    for name in sys.argv[1:]:
        gen_client(name)
