# be/client/<name> — client backend contract

Two files define a client's entire backend surface. `CLIENT_NAME=<name>`
selects the folder; `be/app.py` + `be/sources.py` are generic.

## entities.py — the data model

```python
ENTITIES_ORDER = ["todo"]

entities = {
    "todo": {
        "source": "json",            # SOURCES registry key
        "fields": {                  # schema → OPTIONS + validation
            "id":    {"type": "int", "primary_key": True},
            "title": {"type": "str", "required": True},
            "done":  {"type": "bool", "default": False},
        },
        "ui": {                      # → OPTIONS "content" → admin screen
            "table": { "columns": [...], "actions": [...] },
            "form":  { "fields": [{"name": "title",
                                   "componentType": "TextInput", ...}] },
        },
        "sample_data": [...],        # seeded into data.json on first run
    },
}
```

Generates: `GET/POST /api/todo/`, `GET/PUT/DELETE /api/todo/{id}`,
`GET /api/todo/options/`. List supports `q`, `page`, `size`, `sort`,
`field__eq|in|contains|startswith|endswith|gt|gte|lt|lte` params.

## configuration.json — the client config

```json
{
  "meta":        { client name, theme, language, currency },
  "admin":       { "require_auth": false, "login_redirect", "logout_redirect" },
  "menu":        [ {name, url, entity, public, order, auth_page} ],   // S surface
  "admin_menu":  [ {name, url, entity, icon, sub_menu[]} ],           // A surface
  "language":    [ {name, code} ],
  "sessions":    [ {name, persist, method, method_config} ],          // local sources
  "themes":      [ {value, label, endpoint} ],
  "style-configs": { "<name>": { styles: { "--*": "h s% l%" } } },
  "pages":       { "<slug>": { meta, config: Definition[] } }         // page defs
}
```

Served by `/api/configuration`, `/api/pages/{slug}`,
`/api/style-config/{name}` — the frontend derives layout, admin nav,
themes, and sessions from this one file.

## Notes

- `data.json` is created at runtime (seeded from `sample_data`) and is
  gitignored — delete it to re-seed.
- Sample data is test scaffolding ("mocks through the real contract").
  Replace rows or point `source` at a real source implementation —
  nothing else changes.
- New source types register in `be/app.py → SOURCES` by name.
