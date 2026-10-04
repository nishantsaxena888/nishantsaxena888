# be/client/hello/sources.py
# "Everything is a source" — one contract, many implementations.
# Same contract as nishify's sources/base.py, minus the machinery:
#   list / get / create / update / delete  (+ options stays DSL-derived)
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException


class Source:
    """Contract every source implements — Postgres, ES, JSON, session, API, ..."""
    name = "base"

    def list(self, entity: str, params) -> Dict[str, Any]:
        raise NotImplementedError

    def get(self, entity: str, item_id: int) -> Dict[str, Any]:
        raise NotImplementedError

    def create(self, entity: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def update(self, entity: str, item_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def delete(self, entity: str, item_id: int) -> Dict[str, Any]:
        raise NotImplementedError


_OPS = {"eq", "in", "contains", "startswith", "endswith", "gt", "gte", "lt", "lte"}


def _match(val: Any, op: str, want: Any) -> bool:
    s, w = str(val).lower(), str(want).lower()
    if op == "eq":        return s == w
    if op == "in":        return s in [x.strip().lower() for x in str(want).split(",")]
    if op == "contains":  return w in s
    if op == "startswith":return s.startswith(w)
    if op == "endswith":  return s.endswith(w)
    try:
        f_val, f_want = float(val), float(want)
    except (TypeError, ValueError):
        f_val, f_want = s, w
    return {"gt": f_val > f_want, "gte": f_val >= f_want,
            "lt": f_val < f_want, "lte": f_val <= f_want}.get(op, False)


class JsonSource(Source):
    """JSON-file source — the 'in-house memory' implementation of the contract."""

    name = "json"

    def __init__(self, path: Path, entities: Dict[str, Any]):
        self.path = path
        self.entities = entities

    # -- persistence --
    def _load(self) -> Dict[str, List[Dict[str, Any]]]:
        if self.path.exists():
            return json.loads(self.path.read_text())
        return {n: [dict(r) for r in (c.get("sample_data") or [])]
                for n, c in self.entities.items()}

    def _save(self, store):
        self.path.write_text(json.dumps(store, indent=2, default=str))

    def _rows(self, entity: str) -> List[Dict[str, Any]]:
        if entity not in self.entities:
            raise HTTPException(404, f"Unknown entity: {entity}")
        return self._load().setdefault(entity, [])

    def _coerce(self, entity: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        spec = self.entities[entity]["fields"]
        out = {}
        for name, f in spec.items():
            if name in payload:
                out[name] = payload[name]
            elif "default" in f:
                out[name] = f["default"]
        for name, f in spec.items():
            if f.get("required") and not out.get(name):
                raise HTTPException(400, f"Field required: {name}")
        return out

    @staticmethod
    def _next_id(rows) -> int:
        return max([int(r.get("id", 0)) for r in rows], default=0) + 1

    # -- contract --
    def list(self, entity: str, qp) -> Dict[str, Any]:
        rows = list(self._rows(entity))
        q = qp.get("q")
        if q:
            str_fields = [n for n, f in self.entities[entity]["fields"].items()
                          if f["type"] in ("str", "text")]
            rows = [r for r in rows
                    if any(q.lower() in str(r.get(f, "")).lower() for f in str_fields)]
        for key, vals in qp.multi_items():
            if key in ("page", "size", "q", "sort"):
                continue
            field, _, op = key.partition("__")
            op = op if op in _OPS else "eq"
            for v in ([vals] if not isinstance(vals, list) else vals):
                rows = [r for r in rows if _match(r.get(field), op, v)]
        sort = qp.get("sort")
        if sort:
            for s in reversed(sort.split(",")):
                desc = s.startswith("-")
                rows.sort(key=lambda r: (r.get(s.lstrip("-")) is None,
                                         r.get(s.lstrip("-"))), reverse=desc)
        total = len(rows)
        page, size = int(qp.get("page", 1)), int(qp.get("size", 20))
        start = (page - 1) * size
        return {"items": rows[start:start + size], "page": page, "size": size, "total": total}

    def get(self, entity: str, item_id: int) -> Dict[str, Any]:
        row = next((r for r in self._rows(entity) if r.get("id") == item_id), None)
        if not row:
            raise HTTPException(404, "Not found")
        return row

    def create(self, entity: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = self._coerce(entity, payload)
        store = self._load()
        rows = store.setdefault(entity, [])
        data["id"] = int(payload.get("id") or self._next_id(rows))
        data.setdefault("created_at", datetime.now(timezone.utc).isoformat())
        rows.append(data)
        self._save(store)
        return data

    def update(self, entity: str, item_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        store = self._load()
        rows = store.setdefault(entity, [])
        row = next((r for r in rows if r.get("id") == item_id), None)
        if not row:
            raise HTTPException(404, "Not found")
        row.update(self._coerce(entity, {**row, **payload}))
        row["id"] = item_id
        self._save(store)
        return row

    def delete(self, entity: str, item_id: int) -> Dict[str, Any]:
        store = self._load()
        rows = store.setdefault(entity, [])
        before = len(rows)
        store[entity] = [r for r in rows if r.get("id") != item_id]
        if len(store[entity]) == before:
            raise HTTPException(404, "Not found")
        self._save(store)
        return {"ok": True}
