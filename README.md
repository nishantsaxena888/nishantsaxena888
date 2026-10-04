# nishantsaxena888 — generic client platform

One generic engine, many clients. A product is assembled from **config +
client folder**, never by touching the engine. Modelled on `ns` (frontend),
`nishify` (backend entities), `Uday_AWS` (content-driven components).

```
fe/
  app/                  ← GENERIC frontend (ns engine, stripped). Frozen.
    src/tenants/active.ts      ← GENERATED: which client is live
    scripts/client.mjs         ← client switcher
  client/<name>/
    site/               ← S surface: route "/" — client's components + css
    admin/              ← A surface: route "/admin" — client admin comps
                          (usually empty — generic OPTIONS admin covers it)
be/
  app.py                ← GENERIC entity service. Frozen.
  sources.py            ← Source contract + JsonSource
  client/<name>/
    entities.py         ← data model (fields + ui.table/form + sample_data)
    configuration.json  ← menus, pages, themes, sessions, auth flags
```

Every surface (site `S`, admin `A`) = **css + js + layout + entity
association + implicit RBAC + options + CRUD**, delivered as:
one route (`/` or `/admin/:slug`) + one config + one tenant map.

## Run a client

Two processes — backend serves the client's entities + configuration,
frontend bundles that client's components.

```bash
# backend — pick the client with CLIENT_NAME
cd be
CLIENT_NAME=grocery .venv/bin/python -m uvicorn app:app --port 8100

# frontend — pick the client with the switcher (Vite proxies /api → :8100)
cd fe/app
npm run client -- grocery   # rewrites src/tenants/active.ts
npm run dev                 # → http://localhost:5173 (site), /admin (admin)
```

## Production build (lean — only the active client's code)

```bash
npm run build:hello      # → fe/app/dist/hello
npm run build:grocery    # → fe/app/dist/grocery
npm run build:uday       # → fe/app/dist/uday
```

Each `build:<name>` script regenerates `tenants/active.ts` first — the
bundle contains only that client's code. To add another, hardcode one more
line in `fe/app/package.json` scripts (that's intentional).

## Clients shipped

| Client | Kind | Site pages | Admin entities |
|---|---|---|---|
| `hello` | smoke test | `/` | todo |
| `grocery` | e-commerce | `/`, `/shop`, `/deals` | product, category, order, customer |
| `uday` | learning | `/`, `/courses`, `/lessons` | course, lesson, quiz |

Sample data in `be/client/*/entities.py` is temporary scaffolding ("mocks")
served through the real API contract — replace rows or swap `source` once
real data exists; nothing else changes.

## Add a client (`foo`)

1. `be/client/foo/entities.py` — entities DSL (copy `hello`'s shape:
   `fields` + `ui.table`/`ui.form` + `sample_data`)
2. `be/client/foo/configuration.json` — `menu`, `admin_menu`, `pages`,
   `themes`/`style-configs`, `sessions`, `admin`, `meta`
3. `fe/client/foo/site/tenant.ts` — `export default { components: {...} }`
   (see `fe/client/README.md` for the contract)
4. `fe/client/foo/admin/tenant.ts` — `export default { components: {} }`
   unless the client needs custom admin screens
5. `npm run client -- foo` and run. Optionally add a `build:foo` script
   line in `fe/app/package.json`.

That's it — no engine code changes. Pages come from `pages` defs
(`def.type` → component), admin screens come from entity OPTIONS.

## Switch client

A client runs on **two processes** — switch both:

```bash
# 1. backend — restart with the new CLIENT_NAME
cd be
CLIENT_NAME=uday .venv/bin/python -m uvicorn app:app --port 8100
# (Ctrl+C the old one first — only one backend per port)

# 2. frontend — regenerate the tenant link
cd fe/app
npm run client -- uday        # rewrites src/tenants/active.ts
# Vite hot-reloads automatically if `npm run dev` is running —
# no restart needed.
```

| Client | `npm run client --` | `CLIENT_NAME=` |
|---|---|---|
| Hello | `hello` | `hello` |
| Grocery | `grocery` | `grocery` |
| Uday | `uday` | `uday` |

The names always match: `fe/client/<name>` and `be/client/<name>` are the
same `<name>`.

> `localStorage["vite-client"]` no longer switches the bundle — tenants
> are compiled in per client (`active.ts`), so only the generated client
> exists in the build.

More detail: `fe/client/README.md`, `be/client/README.md`,
`docs/knowledge_base_*.md`.
