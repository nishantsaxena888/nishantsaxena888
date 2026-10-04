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


class SqliteSource(Source):
    """SQLite source — one table per entity (named after the entity).
    Fields are mapped to columns by the entity DSL; `id` is INTEGER PK.
    Config: {"kind": "sqlite", "path": "shop.db"} — path is relative to
    the client folder. Demonstrates DB-per-entity without extra deps."""

    name = "sqlite"

    def __init__(self, path: Path, entities: Dict[str, Any]):
        import sqlite3
        self._sql = sqlite3
        self.path = path
        self.entities = entities
        path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        for entity, cfg in entities.items():
            self._ensure_table(entity, cfg)

    _TYPES = {"int": "INTEGER", "float": "REAL", "bool": "INTEGER",
              "str": "TEXT", "text": "TEXT"}

    def _ensure_table(self, entity: str, cfg: Dict[str, Any]):
        cols = []
        for name, f in cfg["fields"].items():
            col = f'"{name}" {self._TYPES.get(f["type"], "TEXT")}'
            if f.get("primary_key"):
                col += " PRIMARY KEY"
            cols.append(col)
        self._conn.execute(
            f'CREATE TABLE IF NOT EXISTS "{entity}" ({", ".join(cols)})')
        for row in cfg.get("sample_data") or []:
            keys = list(row.keys())
            self._conn.execute(
                f'INSERT OR IGNORE INTO "{entity}" ({", ".join(keys)}) '
                f'VALUES ({", ".join("?" * len(keys))})',
                [row[k] for k in keys])
        self._conn.commit()

    def _rows(self, entity: str, qp=None) -> List[Dict[str, Any]]:
        if entity not in self.entities:
            raise HTTPException(404, f"Unknown entity: {entity}")
        sql, args = f'SELECT * FROM "{entity}"', []
        clauses = []
        if qp is not None:
            for key, val in qp.multi_items():
                if key in ("page", "size", "q", "sort"):
                    continue
                field, _, op = key.partition("__")
                if field not in self.entities[entity]["fields"]:
                    continue
                if op in ("", "eq"):
                    clauses.append(f'"{field}" = ?')
                elif op == "contains":
                    clauses.append(f'"{field}" LIKE ?'); val = f"%{val}%"
                elif op in ("gt", "gte", "lt", "lte"):
                    sym = {"gt": ">", "gte": ">=", "lt": "<", "lte": "<="}[op]
                    clauses.append(f'"{field}" {sym} ?')
                else:
                    continue
                args.append(val)
            q = qp.get("q")
            if q:
                str_f = [n for n, f in self.entities[entity]["fields"].items()
                         if f["type"] in ("str", "text")]
                if str_f:
                    clauses.append("(" + " OR ".join(
                        f'"{f}" LIKE ?' for f in str_f) + ")")
                    args += [f"%{q}%"] * len(str_f)
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sort = qp.get("sort") if qp is not None else None
        if sort:
            parts = []
            for s in sort.split(","):
                desc = s.startswith("-")
                parts.append(f'"{s.lstrip("-")}" {"DESC" if desc else "ASC"}')
            sql += " ORDER BY " + ", ".join(parts)
        return [dict(r) for r in self._conn.execute(sql, args).fetchall()]

    def list(self, entity: str, qp) -> Dict[str, Any]:
        rows = self._rows(entity, qp)
        total = len(rows)
        page, size = int(qp.get("page", 1)), int(qp.get("size", 20))
        start = (page - 1) * size
        return {"items": rows[start:start + size], "page": page,
                "size": size, "total": total}

    def get(self, entity: str, item_id: int) -> Dict[str, Any]:
        row = next((r for r in self._rows(entity) if r.get("id") == item_id),
                   None)
        if not row:
            raise HTTPException(404, "Not found")
        return row

    def create(self, entity: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        spec = self.entities[entity]["fields"]
        data = {n: payload[n] for n in spec if n in payload}
        if "id" not in data:
            data["id"] = max([int(r.get("id", 0)) for r in self._rows(entity)],
                             default=0) + 1
        keys = list(data.keys())
        self._conn.execute(
            f'INSERT INTO "{entity}" ({", ".join(keys)}) '
            f'VALUES ({", ".join("?" * len(keys))})', [data[k] for k in keys])
        self._conn.commit()
        return data

    def update(self, entity: str, item_id: int,
               payload: Dict[str, Any]) -> Dict[str, Any]:
        spec = self.entities[entity]["fields"]
        sets = [n for n in spec if n in payload and n != "id"]
        cur = self._conn.execute(
            f'UPDATE "{entity}" SET ' + ", ".join(f'"{n}" = ?' for n in sets)
            + ' WHERE "id" = ?', [payload[n] for n in sets] + [item_id])
        self._conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Not found")
        return self.get(entity, item_id)

    def delete(self, entity: str, item_id: int) -> Dict[str, Any]:
        cur = self._conn.execute(
            f'DELETE FROM "{entity}" WHERE "id" = ?', [item_id])
        self._conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Not found")
        return {"ok": True}


class HttpSource(Source):
    """HTTP proxy source — forwards the entity contract to an upstream
    REST API (another tenant service, a partner API, a legacy system).
    Config: {"kind": "http", "base_url": "https://...", "headers": {}}.
    Upstream must expose GET/POST/PUT/DELETE on <base_url>/<entity>[/<id>]."""

    name = "http"

    def __init__(self, base_url: str, headers: Dict[str, str] | None = None):
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}

    def _call(self, method: str, path: str, params=None, body=None):
        import urllib.request, urllib.parse, urllib.error
        url = f"{self.base_url}/{path}"
        if params:
            url += "?" + urllib.parse.urlencode(
                {k: v for k, v in dict(params).items()})
        req = urllib.request.Request(
            url, method=method,
            headers={"Content-Type": "application/json", **self.headers},
            data=json.dumps(body).encode() if body is not None else None)
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            raise HTTPException(e.code, e.read().decode()[:300] or e.reason)
        except urllib.error.URLError as e:
            raise HTTPException(502, f"Upstream unreachable: {e.reason}")

    def list(self, entity: str, qp) -> Dict[str, Any]:
        return self._call("GET", f"{entity}/", params=qp)

    def get(self, entity: str, item_id: int) -> Dict[str, Any]:
        return self._call("GET", f"{entity}/{item_id}/")

    def create(self, entity: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._call("POST", f"{entity}/", body=payload)

    def update(self, entity: str, item_id: int,
               payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._call("PUT", f"{entity}/{item_id}/", body=payload)

    def delete(self, entity: str, item_id: int) -> Dict[str, Any]:
        return self._call("DELETE", f"{entity}/{item_id}")
