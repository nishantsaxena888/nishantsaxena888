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
  JSON bundles; `{}` when manifest `mock: false`).
- **Dev multi-client (lazy)**: `src/tenants/dev-all.ts` (generated) holds
  one `() => import()` per client's tenant + styles — every client is its
  own chunk. `ensureClient(name)` in `tenants/index.ts` attaches a client
  on demand (initial `requestedClient()`, and on `client-change`/`storage`
  events in ApiProvider). `ensureClientMocks(name)` in
  `engine/library/mock-data.ts` lazy-loads that client's mock tree the
  same way (per-request inside apiClient). A tree of thousands of clients
  costs nothing until requested; prod never sees dev-all (the
  `import.meta.env.DEV` guard is statically replaced).
- **New client**: `npm run client -- --new <name>` scaffolds
  `fe/client/<name>/` + `be/client/<name>/` (working todo entity +
  `datasources.json` + `roles`).
- **Boundary is enforced by eslint**: app code cannot import `@clients/*`
  (only the three generated `src/tenants/{active,dev-all,mock-active}.ts`
  may); client code can import only React + relative paths (+ type-only
  imports — `RenderComponentProps`/`ClientTenant` from
  `src/tenants/types.ts`). `npm run lint` covers both sides
  (`fe/eslint.config.js` is the client-side entry — eslint only lints
  under its base path).
- **Surface-scoped maps**: `componentsMap[client] = {site, admin}` in
  `src/tenants/index.ts`. Site routes resolve `def.type` against
  `layout + storefront + site_tenant.components`; admin routes against
  `layout + default_admin + admin_tenant.components` via
  `AdminSurfaceProvider` mounted at `DashboardRenderer`. Client wins —
  registering the same `def.type` overrides the generic comp.
- **Storefront tenant** (`src/tenants/storefront/`): generic site blocks
  available to every site surface — canonical `header`, `banner`,
  `listing`, `session-list`, `form-summary`, `account`, `auth-layout`,
  `footer` (legacy aliases resolve: `hero-section`, `products`,
  `cart-view`, `checkout`, `profile`, `login-layout-1`).
- **`site_nav` config flag**: `configuration.site_nav === false` stands
  the generic `SiteNav` down — clients whose pages bring their own
  `header`/`footer` defs set this (grocery does).
- `ClientTenant`/`RenderComponentProps`/`ClientManifest` contract:
  `src/tenants/types.ts`.
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
- Registry top-level `"_mode"` picks the client-wide mode:
  `"loose"` (default, above), `"strict"` — unflagged calls 404 and never
  touch the network (full-mock guarantee), `"auto"` — unflagged calls
  serve a matching file when one exists, else real API.
- `mockFiles` glob is generated per client (`tenants/mock-active.ts`) —
  other clients' mock JSON is never bundled.
- Regenerate a client's whole tree from its backend definitions:
  `python be/tools/gen_mocks.py` (non-entity endpoints GET-only).
- Validate flagged files exist before browser testing:
  `node scripts/check-mocks.mjs` (fe/app).
- Remove mocks later = delete `mock/` + drop the mock lines from
  `scripts/client.mjs` output — nothing else references them.

## Backend: named data sources + RBAC (be/)

- **`be/client/<name>/datasources.json`** declares named sources —
  "db selection per business requirement":

  ```json
  {"json":  {"kind": "json",   "path": "data.json"},
   "shop":  {"kind": "sqlite", "path": "shop.db"},
   "crm":   {"kind": "http",   "base_url": "https://api.example.com",
             "headers": {"Authorization": "Bearer ..."}}}
  ```

  An entity's DSL `"source"` key names one entry; missing file → single
  `json` source on `data.json`. Kinds live in `be/sources.py`
  (`JsonSource`, `SqliteSource` — one table per entity, `HttpSource` —
  proxies the entity contract upstream); a `postgres` kind = one more
  class + registry entry. `X-Data-Source` response header shows
  `name:kind` per request.
- **RBAC** is config-driven and enforced server-side:
  `configuration.json` `"roles": [{"name": "viewer", "default": true},
  {"name": "admin"}]`; per-entity `"rbac": {"read": "*",
  "write": ["admin"]}` in `entities.py` (absent → open). The Bearer JWT's
  `role` claim decides; no token → the `default: true` role.
  `POST /api/login` accepts `"role"` (validated against declared roles)
  and embeds the claim. Tokens are **HS256-signed** (`JWT_SECRET`,
  `JWT_TTL` env) — unsigned/forged/expired tokens fall back to the
  default role. `CORS_ORIGINS` env restricts origins (dev default `*`).
- **Field-level ACL**: per-entity `"field_acl": {"viewer": ["created_at"]}`
  hides fields — stripped from list/get/create/update rows AND from the
  OPTIONS schema (columns, form fields). Scope/RBAC still see them.
- **Row-level rule filters**: per-entity `"filter"` in `entities.py` maps
  role → forced query params (`{"viewer": {"done__eq": "false"},
  "*": {"region__eq": "west"}}` — `"*"` applies to every role and merges
  with the role's own rules). Scope params override caller params
  (callers can't escape), apply to list AND get/put/delete (out-of-scope
  rows → 404). Scope ops (`_cmp`): `eq`, `ne`, `in`, `nin`, `contains`,
  `gt`, `gte`, `lt`, `lte` (numeric when both sides parse).
- **Frontend mirroring**: `menu`/`admin_menu` entries may carry
  `"roles": [...]` — `app-provider` filters them via
  `engine/library/rbac.ts` (token `role` claim or declared default).
  Hiding is UX only; the backend is the enforcement. Login/logout
  dispatch `auth-change` → configuration refetches and menus re-filter.

## Platform abstraction (`src/platform/`)

The seam that makes generic code portable across **web**, **React Native**,
and **Electron**. Reusable storefront components never import
`react-router-dom` or touch `localStorage` directly — they use these:

| Module | Contract | Web impl | RN port (`.native.*`, Metro resolves) | Electron |
|---|---|---|---|---|
| `storage.ts` | `storage.{get,set,remove}Item` sync facade; core lives in `storage-core.ts` | `localStorage` (installed at module load) | `storage.native.ts` — `hydrateStorage()` warms an AsyncStorage-backed mirror before the tree mounts | reuse web (or IPC-backed impl) |
| `navigation.ts` | `useNav()` → `{navigate(path, {replace}), goBack()}`; `useRouteParams()` → route params; `usePath()` → pathname; `registerNavigator`/`navTo` for non-hook callers | `useNavigate`/`useParams`/`useLocation` (react-router) | `navigation.native.ts` — `useNavigation`/`useRoute`; screen name == path minus `/`; `setPathMapper()` customizes | reuse web |
| `host.ts` | `emitAppEvent(name, detail)` / `onAppEvent(name, cb)` → unsubscribe; `reloadApp()` — cross-cutting events (`auth-change`, `client-change`) never use `window` directly | DOM events + `location.reload` | `host.native.ts` — DeviceEventEmitter + DevSettings.reload (dev) | reuse web |
| `primitives.tsx` | `View`, `Text`, `Pressable`, `Anchor`, `Image`, `TextInput`, `ScrollView` — RN-shaped API (`onPress`, `onChangeText`, `to`) | renders `div`/`span`/`button`/`a`/`img`/`input` (semantic via `as` prop) | `primitives.native.tsx` — real RN components; `className` passes through for NativeWind | reuse web |
| `env.ts` | `env(key)`, `isDev()`, `apiUrl()`, `clientName()`, `setEnvConfig()` — shared code never touches `import.meta.env` | `import.meta.env.*` | `env.native.ts` — app calls `setEnvConfig({apiUrl, client, dev})` at boot | reuse web |
| `toast.ts` | `toast.{success,error,info,...}` — components never import sonner directly (via `@/lib/toast`) | sonner | `toast.native.ts` — Alert + `"toast"` app event (host renders its own banners) | reuse web |

RN host-app checklist (one-time, nothing in shared src changes):

1. Metro resolves `*.native.ts(x)` automatically — no config needed.
2. Peer deps the app provides: `react-native`, `@react-navigation/native`,
   `@react-navigation/native-stack`, `@react-native-async-storage/async-storage`
   (`native.d.ts` stubs types so web `tsc` stays green without them installed).
3. `fe/native/` is the ready Expo scaffold — `npm install && npm run start`
   there; it boots `src/native/native-app.tsx` (providers + NavigationContainer
   + Stack screens generated from `config.menu`, `initialParams.slug` feeding
   `useRouteParams` so `PublicRenderer` runs unchanged).
4. Boot: `setEnvConfig({apiUrl, client, dev: __DEV__})` +
   `await hydrateStorage()` + `registerNavigator(navRef.navigate)`
   before first render — App.tsx in fe/native already does this.
5. Styling: NativeWind makes `className` work natively, or map
   className→style in your theme layer.
6. Icons: alias `lucide-react` → `lucide-react-native` in Metro config.
7. Admin screens are DOM-oriented — native shell is site screens only.

Rules for new generic components:

- Use `View`/`Text`/`Pressable`/`Anchor`/`TextInput` — not raw `div`/`a`
  (forms may use `View as="form"` + `Pressable type="submit"`).
- Navigate via `useNav()`/`useRouteParams()`/`usePath()`/`Anchor` — never
  `useNavigate`/`useParams`/`useLocation`/`Link` outside the router shell
  (`create-router`, `app-router-provider`, error boundary).
- Cross-cutting events via `emitAppEvent`/`onAppEvent`, reload via
  `reloadApp` — never `window.dispatchEvent`/`location.reload`.
- Persist via `storage` — never `localStorage` directly.
- `className` is the web-styling hook; the native variant maps it to a
  `style` lookup — keep client visuals in `styles.css` classes.
- Env/build config via `platform/env` (`isDev`/`apiUrl`/`clientName`) —
  never `import.meta.env` in reusable code.
- Electron runs the same web bundle (`ELECTRON=1 npm run build` →
  relative asset base for `file://` loading); `electron/main.cjs` +
  `preload.cjs` are the shell — `ELECTRON_DIST=dist/<client>
  npx electron electron/main.cjs`. Native-only features belong in a
  `platform/<x>.electron.ts` adapter behind the same contract.

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
the same rule. Aliases still resolve (`products`, `product-grid`,
`cards`, `card-list`, `card-grid`, `items`, `cart-view`, `item-list`,
`checkout`, `profile`, `login-layout-1`, `hero-section`) — new defs must
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

## Implicit RBAC (client-side mirror — backend is the real boundary)

One whitelist shape everywhere: a `roles` array on any config item
(`"*"` = all, `[]` = none, absent/non-array = unrestricted). The helpers
live in `src/engine/library/rbac.ts` (`currentRole`, `roleAllowed`,
`visibleByRole`, `methodAllowed`/`rbacMethods`):

| Level | Where | Gate |
|---|---|---|
| Definition | `def.roles` / `def.properties.roles` | `RenderDefinition` skips it — the check runs before `useDynamicData` mounts, so a blocked def fires **no fetch** |
| Menu items | `menu[]`/`admin_menu[]` `.roles` | `visibleByRole` |
| Actions | `table.row_actions[]`/`bulk_actions[]` `.roles` | `default-admin` filters |
| Columns/fields | `columns[].roles`, `form.fields[].roles` | `default-admin` mirrors the server ACL (lets one static mock OPTIONS serve every role) |
| Methods | `content.rbac` (OPTIONS, emitted by the backend from `entities.py`) or `configuration.rbac[entity]` | **`useEntity`** — `can(method)` drives UI; denied calls return 403 without hitting the network |

Method spec is the backend's own shape — action → role whitelist
(`"*"` = every role, scalar allowed, case-insensitive methods; absent
spec/action = allowed). The FE maps methods: `get`/`options`/`head` →
`read`, `post`/`put`/`patch`/`delete` → `write` — the same two actions
`_check_rbac` enforces server-side.

```json
"rbac": {"read": "*", "write": ["admin", "editor"]}
```

Sessions bypass method RBAC (local state; gate them via def `roles`).

Declarative table actions (OPTIONS `content.table`, executed by the
generic grid — no per-screen code):

```json
"table": {
  "export": true,
  "row_actions":  [{"name":"view","label":"View","icon":"eye",
                    "type":"navigate","navigation":"/items/{id}"}],
  "bulk_actions": [{"name":"export_csv","label":"Export"},
                   {"name":"bulk_delete","label":"Delete",
                    "confirm":"Delete selected?"},
                   {"name":"restock","endpoint":"product/{id}/restock",
                    "method":"post"}]
}
```

- `type "api"` (default) → `apiClient` with `{field}` interpolation from
  the row; `type "navigate"` → router push. Builtins: `export_csv`,
  `bulk_delete`. `confirm` gates via the confirm dialog. Row actions
  render as icon buttons beside Edit/Delete; bulk actions live in a
  toolbar that appears when `bulk_actions`/`export` are declared.
- **`table.refresh_interval`** (seconds) polls the list — live order/
  dashboard screens without custom code.
- **Declarative columns**: `columns[].key` supports nested paths
  (`"customer.name"` → `row.customer.name`) for relation display, and
  `columns[].format` names a renderer since JSON can't carry functions:
  `money` (+`currency`), `date`, `datetime`, `boolean`, `percent`,
  `json`, `link` (+`link` template `"/shop?q={name}"`), `badge`
  (+`badge_map` value→variant), `image`. A declared `format` overrides
  the generic `DataRenderer` for that column.
- **Conditional form fields**: an input's `visible` key takes a rule
  `{field, operator, value}`, an array (AND), or `{conditions, logic}` —
  ops mirror the backend filter ops (`eq/ne/in/nin/contains/gt/gte/lt/
  lte/exists`, `===`/`!==`/`includes` aliases kept).

Read-through caching (`engine/library/api-cache.ts`): OPTIONS cached for
the session, GETs 30s TTL, mutations invalidate their endpoint prefix,
identical concurrent calls dedupe. `prefetchEntity(entity)` fires on
admin-nav hover so screens open warm.

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
- `components/shared/old-form-render/` is the legacy form system — only
  the `/playground` dev route still uses it; new screens use
  `generic-form`/`form-render`. Dead admin code (`entity-management`,
  `AdminDashboard`, top-level `components/data-table.tsx`) was removed —
  the live table is `core-component/data-table`.
- Headless UI smoke: `node scripts/smoke-ui.mjs` (needs the dev servers;
  playwright is a devDependency).

## Testing

Vitest + Testing Library (`npm run test`, watch: `test:watch`). The suite
is split by *portability*, not by folder — this is what carries tests to
the React-Native/desktop ports unchanged:

- **`*.test.ts` — node env, zero DOM.** Pure contracts: reducers (session
  strategies), api-cache (TTL/dedupe/invalidation), rbac (role + menu
  visibility), api/mock resolution (strict/loose/auto, lang fallback,
  status/response_type/id), declarative-actions (interpolate + dispatch),
  tenant merge order + legacy aliases, platform storage backend swap.
  Anything an RN port reuses is tested here — these files must never
  import React/DOM APIs.
- **`*.test.tsx` — jsdom.** View-layer contract only: def.type →
  component mapping, children recursion, error/loading surfaces,
  component props → rendered output. External seams (apiClient, stores,
  useEntity, language) are vi.mocked, so a port swaps the harness, not
  the assertions.

Data-driven convention: `it.each` tables — add a row, not a test.
New-behaviour flow (TDD): write the table row/test → watch it fail →
implement → `npm run test`. Coverage: `npx vitest run --coverage`.

Two real bugs were caught by this suite already: cache keys were not
language-namespaced (stale data on lang switch) — fixed by carrying the
lang in the cache namespace.

## Commands

- `npm run dev` — vite dev server (:5173, `/api` proxied to :8100)
- `npm run client -- <name>` — switch active client (regenerates bindings)
- `npm run build` / `npm run build:<name>` — `tsc -b && vite build`
- `node scripts/check-mocks.mjs` — validate flagged mock files exist,
  def.type names resolve, and dynamic action endpoints exist
- `npm run test` / `test:watch` — vitest contract suite (see Testing)
- `npm run lint` — eslint, both sides of the tenancy boundary
  (`fe/app` + `fe/client` via `fe/eslint.config.js`)
- `node scripts/smoke-ui.mjs` — headless browser smoke across all client
  routes (dev servers must be running)
- `./verify.sh` (repo root) — one-shot static gate: python syntax, tsc,
  eslint, check-mocks
