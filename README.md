# nishantsaxena888 — generic client platform

One generic engine, many clients. A product is assembled from **config +
client folder**, never by touching the engine. Modelled on `ns` (frontend),
`nishify` (backend entities), `Uday_AWS` (content-driven components).

```
fe/
  app/                  ← GENERIC frontend (ns engine, stripped). Frozen.
    src/common/tenants/active.ts      ← GENERATED: which client is live
    scripts/client.mjs         ← client switcher
  client/<name>/
    configs/client.json ← manifest (surfaces/styles/mock)
    web/                ← S surface: route "/" — ALL client site comps + css
    layouts/            ← layout comps (grid/col/…), used by both surfaces
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
npm run client -- grocery   # rewrites src/common/tenants/active.ts
npm run dev                 # → http://localhost:5173 (site), /admin (admin)
```

## Production build (lean — only the active client's code)

```bash
npm run build:client -- uday     # → fe/app/dist/uday
npm run build:client -- grocery  # → fe/app/dist/grocery
npm run build:client -- all      # → dist/<name> for every client
```

`scripts/build.mjs` activates the client (regenerating
`tenants/active.ts`) then builds — the bundle contains only that client's
code. Client names are discovered from `fe/client/<name>/configs/`;
no per-client script lines needed.

## Clients shipped

| Client | Kind | Site pages | Admin entities | Admin landing |
|---|---|---|---|---|
| `hello` | smoke test | `/` | overview, todo | `hello-overview` — todo counts |
| `grocery` | e-commerce | `/`, `/shop`, `/deals`, `/cart`, `/checkout`, `/my-account` + auth | overview, product, category, order, customer | `grocery-overview` — revenue/stock stats |
| `airbnb` | stays | `/`, `/stays`, `/stays/:id`, `/wishlist` | overview, listing, host, booking, review, amenity | generic overview |
| `uday` | learning | `/`, `/courses`, `/courses/:id`, `/chapter/:slug`, `/my-learning`, `/guide` | overview, category, course, chapter, revision, review-queue, course_release + user data | `uday-overview` — course/chapter/revision rollup |
| `skillom` | learning | `/`, `/courses`, `/courses/:id`, `/learn/:id`, `/my-learning` | overview, category, course, chapter, revision, review-queue + user data | generic overview |

Each client has **its own site and admin** — full isolation, no shared
runtime fallback: site comps live in `fe/client/<name>/web/` (including
client-owned copies of the generic kit), layout comps in
`fe/client/<name>/layouts/`, admin comps in `fe/client/<name>/admin/`
(resolved surface-scoped — a site `def.type` can't leak into admin). A
custom admin screen = an entity whose OPTIONS returns `config:
Definition[]` (see the `overview` entity in any `entities.py`) + a
component registered in `admin/tenant.ts`; generic CRUD screens still
come from `ui.table`/`ui.form` OPTIONS — zero TS.

Sample data in `be/client/*/entities.py` is temporary scaffolding ("mocks")
served through the real API contract — replace rows or swap `source` once
real data exists; nothing else changes.

## Frontend mocks (run with no backend)

`fe/client/<name>/mock/` holds file-based responses — when an endpoint is
flagged `mock: true` in `mock/config.json`, `apiClient` serves
`mock/<lang>/<endpoint>/<METHOD>/<response>.json` instead of calling the
API. Flag absent or false → real API. Flagged but file missing → 404
(deliberate: the flag selects the source, it isn't a "try first").

```bash
# regenerate a client's whole mock tree from its backend definition
# (skip grocery — its mock tree is hand-maintained; regen overwrites it)
python be/tools/gen_mocks.py hello uday
```

The generator flags **every** endpoint+method — the client runs fully
backend-free (configuration, pages, entities, OPTIONS, style-configs).
Trim `mock/config.json` per endpoint or per method for mixed mode
(e.g. OPTIONS mocked, CRUD real). Supported per-method extras:
`response_type`, `status`, `delay`, `id`, `search_param`.

Only the **active** client's `mock/` is bundled (generated glob in
`fe/app/src/common/tenants/mock-active.ts`). Before browser testing, validate
every flagged file exists:

```bash
cd fe/app && node scripts/check-mocks.mjs
```

## Add a client (`foo`)

```bash
cd fe/app && npm run client -- --new foo
```

scaffolds everything: `fe/client/foo/` (configs/client.json manifest,
web/ + layouts/ with the full component kit copied in, admin/ tenants +
styles) **and** `be/client/foo/` (entities.py + configuration.json with
a working todo entity). Then:

1. `be/client/foo/entities.py` — replace the todo with your entities
   (`fields` + `ui.table`/`ui.form` + `sample_data`)
2. `be/client/foo/configuration.json` — `menu`, `admin_menu`, `pages`,
   `themes`/`style-configs`, `sessions`, `admin`, `meta`
3. `fe/client/foo/web/` — components + `web/tenant.ts` registrations
   (`--new` already copies the full component kit into `web/` +
   `layouts/` — trim or extend as the client needs)
4. Optional: `python be/tools/gen_mocks.py foo` then `mock: true` in
   `fe/client/foo/configs/client.json`
5. `npm run client -- foo` (validates the manifest) and run — backend:
   `CLIENT_NAME=foo`

That's it — no engine code changes. Pages come from `pages` defs
(`def.type` → component), admin screens come from entity OPTIONS.

## Platforms

The same engine serves three surfaces:

```bash
# web — npm run dev (multi-client lazy loads in dev)
# desktop — Electron shell over the same bundle
cd fe/app && npm run build:desktop && npm run electron
# mobile — Expo app in fe/native (site surfaces; admin is DOM-only)
cd fe/native && npm install && npm run start
```

Shared code targets the `src/platform/` seams (primitives, navigation,
storage, host, env, icons, mermaid…) — web impls on one side, `.native.*`
RN variants on the other.

## Capabilities

- **Sessions**: configured client-side collections (`progress`, `bookmark`,
  `recent`, `cart`…) — components read/write via the `session` prop bridge.
- **RBAC + CRUD**: `roles` in configuration + per-entity `rbac` in
  entities.py; enforced by the backend, mirrored in OPTIONS →
  `useEntity.can()`; generic `RowActions` (`row_actions`/`card_actions`
  in page defs).
- **Themes**: `themes` + `style-config/<theme>` mocks set CSS vars on
  `:root` + a `theme-<name>` class on `<html>` (uday ships `uday-dark`).
- **Languages**: `language[]` per client — uday/skillom have
  en/hi/es/de/bn; per-endpoint mock fallback to `en`. Content translation
  workflow: `docs/antigravity-course-translation-prompt.md`.

## Verify

```bash
./verify.sh                        # tsc + lint + unit — ALL CHECKS PASS
cd fe/app && npm run e2e           # all clients, routes + flows — ALL E2E PASS
cd fe/app && node scripts/check-mocks.mjs   # offline: every flagged mock has a file
cd fe/app && node scripts/smoke-ui.mjs      # headless Chromium smoke
```

The e2e suite renders every site page and every `admin_menu` entity page
for all clients plus interaction flows (quiz answers, session writes,
review-queue transitions, admin CRUD), failing on console errors, page
errors, or 404s — including the expected not-found route.

## Switch client

A client runs on **two processes** — switch both:

```bash
# 1. backend — restart with the new CLIENT_NAME
cd be
CLIENT_NAME=uday .venv/bin/python -m uvicorn app:app --port 8100
# (Ctrl+C the old one first — only one backend per port)

# 2. frontend — regenerate the tenant link
cd fe/app
npm run client -- uday        # rewrites src/common/tenants/{active,mock-active}.ts
# — swaps both surfaces: site comps, admin screens, styles, mocks
# Vite hot-reloads automatically if `npm run dev` is running —
# no restart needed.
```

| Client | `npm run client --` | `CLIENT_NAME=` |
|---|---|---|
| Hello | `hello` | `hello` |
| Grocery | `grocery` | `grocery` |
| Airbnb | `airbnb` | `airbnb` |
| Uday | `uday` | `uday` |
| Skillom | `skillom` | `skillom` |

The names always match: `fe/client/<name>` and `be/client/<name>` are the
same `<name>`.

> `localStorage["vite-client"]` no longer switches the bundle — tenants
> are compiled in per client (`active.ts`), so only the generated client
> exists in the build.

More detail: `fe/client/README.md`, `be/client/README.md`,
`docs/knowledge_base_*.md`.
