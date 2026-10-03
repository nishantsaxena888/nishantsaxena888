# `ns` — JSON-driven White-Label Storefront Engine

> The **frontend** of the nishify platform. Pages are not hand-written — they are
> JSON **definitions** rendered by a generic engine. This doc is the complete
> reference for the repo.

## Nishant's Model

### Points

1. React will be the frontend — mobile, desktop and web responsive using shadcn, plus packaged desktop app (Electron/Tauri); it will be multilingual and multi-theme enabled, with offline mode and implicit sync.
2. Even UI sessions (checkout, add-to-cart) are sources.
3. The API layer derives layout, site — everything — from options.
4. The same site can serve different sites — change the config and the component library in package.json and rebuild: multi-tenancy via build only.
5. Components live in a separate library (package.json dependency); change the layout and you can produce anything.
6. Authentication and authorization are implicit too — SSO identity in, RBAC enforced server-side, UI just consumes it (menus, fields, routes render per group permissions).

### Details

> **Knowledge base (discussion + Devin's understanding — for implementation):**
>
> - **Mock-first engine** (pt 3): `config.json` `mock: true` per endpoint+method
>   → file mocks mirroring real response shapes. Contract freezes in mocks
>   first; nishify backend implements it. `VITE_API_URL` + flags → live.
> - **Package split in progress** (pt 5): `package.json` repointed `nishify` →
>   `file:../../library/generic-marketplace` (vendored lib source with own
>   components/engine/tenants + vite build + `fe-library-*.tgz` packs).
>   Target: app repo = engine + config + mocks + tenant glue only. Pending:
>   `node_modules/nishify` symlink still points to the dead old path — needs
>   `npm install`; verify `../../` resolves correctly (may need `../library/`).
> - **Sessions as local sources** (pt 2): `useGenericState` zustand stores
>   configured by server JSON (`sessions[]` in configuration response);
>   `useEntity` reads/writes the store instead of HTTP — a local source
>   behind the same entity interface. Persisted as `<client>_gs_<name>`.
> - **Offline + sync** (pt 1): offline = local sources serve; sync =
>   source→source reconciliation. Needs `last_updated_at` delta contract,
>   tombstones for deletes, conflict policy — see nishify.md details.
> - **Open gaps (to fill via discussion)**: desktop packaging tech pick
>   (Electron vs Tauri), offline storage engine (IndexedDB/SQLite/localStorage),
>   PWA vs packaged app for offline mode, sync conflict policy.
> - **OPTIONS-derived admin** (pt 3): `OPTIONS /{entity}` → `default-admin`
>   renders table/form/filters — admin screens are free per entity.
> - **Implicit authN/authZ (frontend half)**: SSO via Keycloak (`nish_auth`)
>   or any OIDC — JWT in `localStorage.token`, `jwt-decode` expiry check in
>   `Protected` (`/admin/:slug`); `logout_redirect` from config. Frontend
>   enforcement is UX-only — real RBAC stays backend (row/column via query
>   wrapper). UI side consumes it implicitly: OPTIONS responses arrive
>   pre-filtered (hidden columns never sent), `admin_menu` `hide` flags +
>   group perms drive which routes/menus render, forms only show writable
>   fields. Design rule: client hides for UX, server denies for security.

## Repo Facts

| | |
|---|---|
| Local path | `/Users/nishantsaxena/workspace/ns` |
| Remote | `git@bitbucket.org:nsaxena/ns.git` (**Bitbucket**, not GitHub) |
| Active branch | `nishant` |
| Stack | React 19, Vite, TypeScript, Tailwind v4, Zustand, axios, shadcn-style primitives |
| Package | `nishify-app` (`frontend/package.json`) |

## Repo Layout

```
ns/
├── frontend/                  # THE app — everything below lives here
│   ├── AGENTS.md              # authoritative architecture doc (source of this file)
│   ├── config.json            # endpoint registry: mock:true + search_param/id/status/delay
│   ├── mock-server.cjs        # file-based mock server (`npm run dev` runs vite + this)
│   ├── fe-library-1.0.2.tgz   # committed tarball of the shared component lib (`nishify` pkg)
│   └── src/
│       ├── main.tsx           # → RootProvider
│       ├── index.css          # tailwindcss only; @theme maps --<key> vars → tokens
│       ├── engine/
│       │   ├── render-engine/ # RenderEngine, RenderDefinition, types, context
│       │   ├── library/       # api.ts (apiClient), loadMockData.ts, reducers.ts
│       │   └── hooks/         # use-entity, use-admin, use-public-render, use-curd-entity…
│       ├── store/use-generic-state.ts   # zustand — config-driven session engine
│       ├── mock/<client>/<lang>/<endpoint>/<METHOD>/<response_type>.json
│       ├── tenants/           # index.ts componentsMap + admin/ + per-client overrides
│       └── components/        # shared/ (root-provider, public-renderer, dashboard-renderer,
│                              #   iterator) + ui/ primitives
├── library/generic-marketplace/  # standalone package copy of shared components
├── gold.md                    # spec: Config-Driven State Engine (useGenericState)
├── integration.md             # blueprint: merging nishify-old-version + nishify-base
│                              #   + nishify-ui-comp into one monorepo (historical plan)
└── notes.txt                  # repo breakdown of the 4 source repos this was merged from
```

## Boot Sequence

`src/main.tsx` → `RootProvider` (`components/shared/root-provider.tsx`):

```
LanguageProvider
└─ ApiProvider          — merges mock data per client, picks componentMap
   └─ AppProvider       — fetches "configuration" → config store + sessions
      └─ ThemeProvider  — theme vars (e.g. emerald-grocery)
         └─ AppRouterProvider — createBrowserRouter
```

## Request Lifecycle

1. Route hit (`/cart`) → `PublicRenderer` looks up `slug` in `config.data.menu`
   → `{url, entity, public, auth_page}`.
2. `usePublicRender` calls `apiClient(entity, {method: "get"})`.
3. `apiClient` (`src/engine/library/api.ts`) checks `config.json`:
   `endpoint.METHOD.mock === true` → serves
   `src/mock/<client>/<lang>/<endpoint>/<METHOD>/<response_type>.json`;
   otherwise falls through to axios at `VITE_API_URL/api/...` (the nishify backend).
4. Page JSON = `{meta, config: Definition[]}` → `DynamicPage` sets `<title>`,
   hands `config` to `<RenderEngine>`.
5. `RenderEngine` maps `def.type` → component via `componentMap`, passing
   `{id, type, content, properties, actionData, config, themeName}`.
6. Dynamic defs (`properties.type === "dynamic"` + `properties.action[]` of
   `{key, endpoint, method, queryParams}`) are fetched by `useDynamicData` on
   mount; component gets `actionData = {data, loading, action, searchParameters}`.
   `action({key, type: "reload"|"filter"|"search", data})` re-fires the call.

## Sessions — Config-Driven State Engine (`gold.md`)

The signature idea: **zero hardcoded client state**. The `configuration`
response declares `sessions[]`; the engine instantiates zustand stores at
runtime:

```json
{"name": "cart", "persist": true, "method": "array_upsert",
 "method_config": {"match_key": "id", "on_match": "increment",
                   "increment_field": "qty", "default_fields": {"qty": 1}}}
```

`AppProvider` → `buildConfigFromSessions()` → `useGenericState.configure()`.
`update("cart", product)` runs the named reducer strategy — `array_upsert`,
`array_toggle`, `array_remove`, `array_prepend_unique`, `replace`, `merge` —
and persists to localStorage as `<client>_gs_<name>`. `useEntity("cart")`
detects registered sessions and reads/writes the store instead of HTTP.

## Tenancy

- `componentsMap` in `src/tenants/index.ts` keys per client (`grocery`,
  `fashion`, `liquor`, `restaurant`) — all spread `default` + `admin`.
- Active client: `localStorage["vite-client"]` or `VITE_CLIENT` env
  (`getActiveClient` in api-provider).
- Mock merge order: `grocery` ∪ `default` ∪ `<client>` (later wins), per lang.
- `src/mock/<client>/mock.ts` uses `import.meta.glob` — must live physically
  in each client folder (Vite binds globs at build time).
- `config.json` = endpoint registry; `CLIENT_STYLE_OPTIONS` in `src/mock/mock.ts`
  maps style ids → `style-config/<id>` endpoints per client.

## Multilingual — 3 layers

1. **API/mock content** — `mock/<client>/<lang>/<endpoint>/...`; `apiClient`
   sends `lang`/`Accept-Language`, falls back to `default_language` ("en").
2. **UI strings** — `useLanguage().t(key)` →
   `mock/<client>/<lang>/translations/GET/success.json` (flat map; missing keys
   echo the key).
3. **Per-field localization** — `useLanguage().l(obj, "a.b")` reads
   `obj.translations[<lang>].a.b`, falls back to the base field.

Language persists in `localStorage["language"]`; `setLanguage` triggers a full
reload. Languages are hardcoded in `LANGUAGES` (language-provider.tsx): `en`,
`hi` — not config-driven.

## Theming

- Theme in `localStorage["vite-ui-theme"]`; options = `CLIENT_STYLE_OPTIONS`.
- `setTheme()` also calls `setActiveClient()` — **theme and tenant are coupled**
  (picking "Liquor Black" switches mock data to `liquor`).
- `ThemeProvider` fetches `style-config/<theme>` →
  `{styles: {primary: "152 70% 35%", ...}}` → sets each `--<key>` on `<html>`
  plus `<style id="dynamic-style-config">`; adds `theme-<name>` class.
- `index.css` `@theme` maps vars to Tailwind v4 tokens → utilities repaint.
- `useFormStyleStore` (persisted `nishify-form-style`) = separate layer for
  form field height/radius/sidebar knobs.
- New theme = one `style-config/<name>/GET/success.json` + one
  `CLIENT_STYLE_OPTIONS` entry.

## Admin — OPTIONS response IS the screen

`/admin/:slug` → `Protected` (JWT in `localStorage.token`, `jwt-decode` expiry
check) → `DashboardRenderer`:

1. `useDashboardRenderer` flattens `admin_menu` (respects `hide: true`) →
   `activePage.entity`.
2. `DashboardControl` calls `OPTIONS /<entity>` via `useDashboardControl`.
3. OPTIONS returns a Definition of `type: "default-admin"` whose `content`
   carries `table.columns` (key/label/type/sortable/searchable/status
   variants), `table.actions` (`open_form`, `confirm_delete`), and
   `form.fields` (`componentType`: TextInput/NumberInput/Select/…, required,
   colSpan, options). If OPTIONS returns only `content`, DashboardControl
   synthesizes the definition itself.
4. `RenderEngine` → `default-admin` → CRUD via `use-curd-entity.ts` (GET list,
   POST, PUT /:id, DELETE /:id; `onChangeHandle` → `reload`; 500ms-debounced
   search; confirm dialog; `useProcess` loader).

**New admin CRUD module = one OPTIONS JSON + one `admin_menu` entry — no TS.**

`useAdmin` handles logout → `config.admin.logout_redirect`.

## Component Convention — view + hook contract

Every component is two files: `<name>.tsx` (pure JSX, no logic) and
`use-<name>.ts` (all logic). The hook returns a standard shape:

```ts
{ handlers, states, uiRefs, config, ...domainData }
```

Handlers prefer `controle.action(...)` when the engine supplies it, falling
back to `navigate()` etc. **Components are engine-optional** — every engine
input has a fallback, so the same component runs standalone (`/playground`)
or inside RenderEngine; the hook auto-detects which mode it's in.

Examples: `use-header`, `use-footer`, `use-hero-section`,
`use-dashboard-control`, `use-curd-entity`, `use-public-render`,
`use-media-upload`.

## Shared Component Library

`nishify` in package.json = `fe-library-1.0.2.tgz` (committed tarball, package
name `fe-library`). `src/tenants/default/index.tsx` maps def types to library
components (`header`, `footer`, `hero-section`, `products`, `cart-view`,
`checkout`, `profile`, `login-layout-1`). The fe-library **source repo is not
in this workspace** — needed to rebuild the tarball.

## Gotchas

- `render-engine-context.tsx` has a commented-out time-bomb
  (`isTimeValid("2026-04-22")` → "Credit Expire") — dev license check, disabled.
- `apiClient` logs `console.warn` on every mock bypass and sets debug globals
  on `window` (`_LATEST_API_*`) — useful when a mock doesn't match.
- Mock match is strict on `id`; `search_param` checking is currently disabled.
- Type safety ends at the engine boundary — `content`, `properties`, `config`
  are all `any`.
- `src/index.css` imports only `tailwindcss`. `nishify` ships `dist/style.css`
  (`nishify/style.css` export) which is NOT imported anywhere, and Tailwind v4
  won't scan `node_modules` without an `@source` directive — likely cause of
  missing library-component styles.
- `mock-server.cjs` + `npm run mock-server` exists for file-based mocks
  (`npm run dev` runs vite + mock-server together).

## Commands

```bash
cd frontend
npm run dev      # vite + mock server
npm run build    # tsc -b && vite build
npm run lint     # eslint
```

## How It Fits the Platform

`ns` (this frontend) consumes the same entity contract that the `nishify`
repo's FastAPI backend generates — `GET /api/{entity}/` list/get/post/put/
delete, `GET /api/{entity}/options/` schemas, `/_search/` federated search.
In dev it runs entirely on file mocks; pointing `VITE_API_URL` at a running
`nishify` backend (with `CLIENT_NAME` aligned) switches it live.

Related docs: `frontend/AGENTS.md` (authoritative), `gold.md` (state-engine
spec), `integration.md` (original monorepo-merge blueprint), `notes.txt`
(provenance of the 4 merged repos).
