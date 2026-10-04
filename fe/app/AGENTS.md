# Architecture: JSON-driven white-label platform engine

Pages are not hand-written. They are JSON **definitions** rendered by a generic
engine. Clients are "dumb": a client folder holds components, styles, and mocks
— all behavior comes from backend config + entity metadata. Understand this
before editing anything.

## Surfaces: S and A

Every client has two surfaces, each = css + js + layout + entity association +
RBAC (planned) + OPTIONS + CRUD:

- **S (site)** — `/:slug` routes, driven by `configuration.menu[]` + `pages{}`
- **A (admin)** — `/admin/:slug` routes, driven by `admin_menu[]` + OPTIONS

## Boot sequence

`src/main.tsx` → `RootProvider` (`src/components/shared/root-provider.tsx`):

```
LanguageProvider
└─ ApiProvider          — setApiConfiguration(client/lang/base_url), picks
   └─ AppProvider       —   surface component maps for the active client
      └─ ThemeProvider  — fetches "configuration" → config store + sessions
         └─ AppRouterProvider — style-config → CSS vars
                             createBrowserRouter (create-router.tsx)
```

## Request lifecycle (site)

1. Route hit (`/shop`) → `PublicRenderer` (`components/shared/public-renderer`)
   looks up `slug` in `config.data.menu` → `{url, entity, public, auth_page}`.
   `SiteNav` renders `menu[]` links; `/` renders `home_page`.
2. `apiClient(entity, {method: "get"})` → mock registry first (see Mocking),
   then axios at `VITE_API_URL/api/<endpoint>` (dev: empty base → Vite proxy
   → backend :8100).
3. Page JSON = `{meta, config: Definition[]}` → `DynamicPage` sets `<title>`,
   hands `config` to `<RenderEngine>`.
4. `RenderEngine` maps `def.type` → component via the **site** component map,
   passing `{id, type, content, properties, actionData, config, themeName}`.
   Every def needs `properties: {level, type}` (`level: "base"`,
   `type: "static" | "dynamic"`).
5. Dynamic defs (`properties.type === "dynamic"` + `properties.action[]` of
   `{key, endpoint, method, queryParams}`) are fetched by `useDynamicData` on
   mount; component receives `actionData = {data, loading, action,
   searchParameters}` where `data[key]` = that action's response body.
   `action({key, type: "reload"|"filter"|"search", data})` re-fires the call.

Key files:

- `src/engine/render-engine/` — RenderEngine, RenderDefinition, context,
  `AdminSurfaceProvider`
- `src/engine/library/api.ts` — apiClient (mock routing + axios fallback)
- `src/engine/library/mock-data.ts` — indexes the generated mock glob
- `src/engine/library/reducers.ts` — session reducer strategies
- `src/engine/hooks/use-entity.ts` — CRUD hook (session-aware)

## Tenancy

```
fe/app/                  ← generic engine, THE app (only package.json)
fe/client/<name>/
  client.json            ← manifest: {name, surfaces{site,admin}.styles, mock}
  site/    tenant.ts     ← { components: {def.type → Component} }
           components/     client site comps
           styles.css      bundled when manifest surfaces.site.styles
  admin/   tenant.ts     ← admin overrides; {} = generic admin only
           components/
           styles.css      bundled when manifest surfaces.admin.styles
  mock/                  ← client-owned mock tree (see Mocking)
```

- **Switch client**: `npm run client -- <name>` reads `client.json`,
  validates it (tenants + declared styles exist), regenerates
  `src/tenants/active.ts` (tenant imports + styles.css imports) and
  `src/tenants/mock-active.ts` (mock glob literal → only this client's mock
  JSON bundles; `{}` when manifest `mock: false`). `getActiveClient()` =
  `VITE_CLIENT` env or the generated client — **localStorage does NOT
  switch clients** (other clients' code is not in the bundle).
- **New client**: `npm run client -- --new <name>` scaffolds
  `fe/client/<name>/` + `be/client/<name>/` (working todo entity).
- **Surface-scoped maps**: `componentsMap[client] = {site, admin}` in
  `src/tenants/index.ts`. Site routes resolve `def.type` against
  `storefront_components + site_tenant.components`; admin routes against
  `default_admin_component + admin_tenant.components` via
  `AdminSurfaceProvider` mounted at `DashboardRenderer`.
- **Storefront tenant** (`src/tenants/storefront/`): generic commerce
  blocks available to every site surface — `header`, `hero-section`,
  `products`, `footer`, `cart-view`, `checkout`, `profile`,
  `login-layout-1` (all five auth card variants via
  `content.config.type`). Def types match the source naming so page
  definitions port verbatim. A client can override any of them by
  registering the same `def.type` in its own site tenant.
- **`site_nav` config flag**: `configuration.site_nav === false` stands
  the generic `SiteNav` down — clients whose pages bring their own
  `header`/`footer` defs set this (grocery does).
- `ClientTenant` contract: `src/tenants/types.ts`.
- Per-client builds: `npm run build:hello|grocery|uday` → `dist/<name>`.

## Mocking (client-owned, removable)

```
fe/client/<name>/mock/
  config.json                          ← registry: {endpoint: {METHOD:
                                         {mock, response_type, status,
                                          delay, id, search_param}}}
  <lang>/<endpoint>/<METHOD>/<file>.json  e.g. en/pages/home/GET/success.json
```

- `apiClient` → `resolveMock`: registry `mock:true` → serve file (404 if
  flagged-but-missing); absent/`false` → real axios. Registry flags =
  source selection per endpoint+method, so mixed mock/real mode = edit
  `mock/config.json` only.
- `mockFiles` glob is generated per client (`tenants/mock-active.ts`) —
  other clients' mock JSON is never bundled.
- Regenerate a client's whole tree from its backend definitions:
  `python be/tools/gen_mocks.py` (non-entity endpoints GET-only).
- Validate flagged files exist before browser testing:
  `node scripts/check-mocks.mjs` (fe/app).
- Remove mocks later = delete `mock/` + drop the mock lines from
  `scripts/client.mjs` output — nothing else references them.

## Sessions (client-side state)

`configuration` returns `sessions[]`:

```json
{"name": "cart", "persist": true, "method": "array_upsert",
 "method_config": {"match_key": "id", "on_match": "increment",
                   "increment_field": "qty", "default_fields": {"qty": 1}}}
```

`AppProvider` → `buildConfigFromSessions()` → `useGenericState.configure()`
(zustand, `src/store/use-generic-state.ts`). `update("cart", product)` runs
the named strategy (`array_upsert`, `array_toggle`, `array_remove`,
`array_prepend_unique`, `replace`, `merge`) and persists to localStorage as
`<client>_gs_<name>`. `useEntity("cart")` detects registered sessions and
reads/writes the store instead of HTTP — the entity API contract is the
same for sessions and sources.

## Theming

- Theme id in `localStorage["vite-ui-theme"]`; `ThemeProvider` fetches
  `style-config/<name>` via apiClient → `{styles: {primary: "152 70% 35%",
  ...}}` → sets each `--<key>` on `<html>` + `<style id="dynamic-style-config">`.
- `index.css` `@theme` maps vars to Tailwind v4 tokens
  (`--color-primary: hsl(var(--primary))`) — utilities repaint instantly;
  also holds the shared `.app-*` component classes.
- `useFormStyleStore` (persisted `nishify-form-style`) = separate layer for
  form field height/radius/sidebar knobs.
- Client-scoped CSS: `fe/client/<name>/{site,admin}/styles.css` — bundle
  only what that surface needs; theme values still come from style-config.


## Layout primitives (config-driven page layout)

`src/tenants/layout/` — structural-only comps merged into EVERY client's
site+admin maps (before client comps, so clients can override). Page layout
is pure JSON: defs nest via `children[]` (RenderDefinition already recurses).

| def.type | Renders | Key properties (all optional) |
|---|---|---|
| `grid` | CSS grid, 12 cols | `columns`, `gap`, `row_gap`, `column_gap`, `align`, `justify`, `padding` |
| `col` | grid cell — self-declares span | `span`, `span_md` (<=1024px), `span_sm` (<=640px), `order`, `align` |
| `container` | centered max-width wrap | `max_width` (default 1200px), `padding` |
| `section` | full-bleed band | `background`, `padding` |
| `stack` | vertical flex | `gap`, `align`, `justify`, `direction`, `wrap` |
| `spacer` | empty space | `height` (default 24px) |

Every primitive also accepts `class_name` + `style` (inline overrides) and
reads knobs from `content` or `properties`. Example: grocery `/shop` uses
`section > container > grid > col(span 3, sidebar promo) + col(span 9,
products)` — responsive stacking on mobile via `span_md`. Verified
side-by-side at 1400px and stacked at 500px.

## Naming rule: def types are UI-generic, not domain-specific

Generic component type names describe the UI role only — domain words
belong in the def's labels/config, never in the type:

| Canonical type | Renders | Domain comes from |
|---|---|---|
| `banner` | media + headline + CTA | content.hero |
| `listing` | card grid, item action → named session | actionData + properties.session |
| `session-list` | named session items + qty + totals | properties.session (default "cart"), content.continue_url/checkout_url |
| `form-summary` | form + session summary → POST | content.submit_entity, field labels |
| `account` | record form + related list | content fields |
| `auth-layout` | auth card variants | content.config.type |
| `header`/`footer` | page chrome | endpoint data |

`grid`/`col`/`container`/`section`/`stack`/`spacer` (layout primitives) follow
the same rule. Legacy aliases (`products`, `cart-view`, `checkout`,
`profile`, `login-layout-1`, `hero-section`) still resolve — new defs must
use canonical names. Client-repo comps MAY use domain names
(`course-list`, `hello-banner`) — that's client vocabulary inside its own
folder.

## Admin

`/admin/:slug` → `Protected` (JWT `localStorage.token`, `jwt-decode` expiry;
skipped when `configuration.admin.require_auth === false`) →
`DashboardRenderer` (AppSidebar from `admin_menu[]`, respecting `hide`).

Admin screens are entity-driven — **the OPTIONS response IS the screen**:

1. `useDashboardRenderer` flattens `admin_menu` → `activePage.entity`.
2. `DashboardControl` calls `OPTIONS /<entity>`.
3. OPTIONS `content` carries `table.columns` (key/label/type/sortable/
   searchable/status variants), `table.actions` (`open_form`,
   `confirm_delete`), and `form.fields` (`componentType`: TextInput/
   NumberInput/Select/..., required, colSpan, options). A full
   `config: Definition[]` may also be returned; otherwise DashboardControl
   synthesizes a `default-admin` def.
4. `RenderEngine` (admin map) → `default-admin` → CRUD via
   `use-curd-entity.ts` (wraps `useEntity`; `onChangeHandle` → reload for
   page/sort/filter, 500ms-debounced search, confirm dialog).

New admin CRUD module = entity `ui` metadata + one `admin_menu` entry —
no TS. Custom admin screens: put the component in `admin/components/`,
register `def.type` in `admin/tenant.ts`, return that def from OPTIONS.

## Component convention: view + hook contract

Every component is two files: `<name>.tsx` (view) and `use-<name>.ts`
(logic). The hook returns `{ handlers, states, uiRefs, config,
...domainData }`; the view unpacks it.

**Components are engine-optional**: every engine input has a fallback
(`controle?` optional; `actionData?.data?.x || content`). Same component
runs standalone (e.g. `/playground`) or inside RenderEngine.

Client components get engine deps through the `@/` alias (e.g. `useEntity`,
`@/lib/toast`) — never import `sonner`/app internals directly; client
folders sit outside `src/` so package resolution goes through the app's
imports.

## Multilingual (three layers)

1. **API/mock content** — `mock/<lang>/<endpoint>/...`; `apiClient`
   sends `lang`/`Accept-Language` headers and falls back to the
   configured default (`configuration.meta.language`, else `en`).
2. **UI strings** — `useLanguage().t(key)` from the `translations`
   endpoint; missing keys echo the key (storefront comps use `makeTr`
   for a literal fallback).
3. **Per-field localization** — `useLanguage().l(obj, "a.b")` reads
   `obj.translations[<lang>].a.b`, falling back to the base field.

Languages are **config-driven**: `configuration.language[]` =
`{name, code, flag?}` (flags guessed for common codes otherwise).
`localStorage["language"]` persists the choice; `setLanguage` reloads.

## Gotchas

- `apiClient` sets debug globals on `window` (`_LATEST_API_*`).
- Registry `id` constraint matching is strict; `search_param` checking is
  currently disabled.
- Type safety ends at the engine boundary — `content`, `properties`,
  `config` are `any`.
- `.env`: keep `VITE_API_URL` empty in dev (relative calls → Vite proxy →
  :8100) and do NOT set `VITE_CLIENT` — it would override `tenants/active.ts`.
- **No top-level await for dev-only imports.** A TLA `await import()` here
  deadlocks the whole module graph silently (dev-all → client comps →
  `@/engine` → `api.ts` → `mock-data` → dev-all): pages render blank with
  zero console errors. Use a runtime promise (`tenantsReady`, `mockReady`)
  and let the provider/api call await it — the `import.meta.env.DEV`
  ternary still dead-code-eliminates the chunk in prod.
- Headless UI smoke: `node scripts/smoke-ui.mjs` (needs the dev servers;
  playwright is a devDependency).

## Commands

- `npm run dev` — vite dev server (:5173, `/api` proxied to :8100)
- `npm run client -- <name>` — switch active client (regenerates bindings)
- `npm run build` / `npm run build:<name>` — `tsc -b && vite build`
- `node scripts/check-mocks.mjs` — validate flagged mock files exist
- `npm run lint` — eslint
