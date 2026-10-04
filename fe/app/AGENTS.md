# Architecture: JSON-driven white-label storefront engine

Pages are not hand-written. They are JSON **definitions** rendered by a generic
engine. Understand this before editing anything.

## Boot sequence

`src/main.tsx` → `RootProvider` (`src/components/shared/root-provider.tsx`):

```
LanguageProvider
└─ ApiProvider          — merges mock data per client, picks componentMap
   └─ AppProvider       — fetches "configuration" → config store + sessions
      └─ ThemeProvider  — theme vars (e.g. emerald-grocery)
         └─ AppRouterProvider — createBrowserRouter (create-router.tsx)
```

## Request lifecycle

1. Route hit (`/cart`) → `PublicRenderer` (`components/shared/public-renderer`)
   looks up `slug` in `config.data.menu` → `{url, entity, public, auth_page}`.
2. `usePublicRender` calls `apiClient(entity, {method: "get"})`.
3. `apiClient` (`src/engine/library/api.ts`) checks `config.json` (ApiConfigMap):
   `endpoint.METHOD.mock === true` → serves
   `src/mock/<client>/<lang>/<endpoint>/<METHOD>/<response_type>.json`.
   Otherwise falls through to axios at `VITE_API_URL/api/...`.
4. Page JSON = `{meta, config: Definition[]}` → `DynamicPage` sets `<title>`,
   hands `config` to `<RenderEngine>`.
5. `RenderEngine` maps `def.type` → component via `componentMap`, passing
   `{id, type, content, properties, actionData, config, themeName}`.
6. Dynamic defs (`properties.type === "dynamic"` + `properties.action[]` of
   `{key, endpoint, method, queryParams}`) are fetched by `useDynamicData` on
   mount; component receives `actionData = {data, loading, action,
   searchParameters}`. `action({key, type: "reload"|"filter"|"search", data})`
   re-fires the call.

Key files:

- `src/engine/render-engine/` — RenderEngine, RenderDefinition, types, context
- `src/engine/library/api.ts` — apiClient (mock routing + axios fallback)
- `src/engine/library/loadMockData.ts` — glob → `mock[lang][endpoint][method][file]`
- `src/engine/library/reducers.ts` — session reducer strategies
- `src/engine/hooks/use-entity.ts` — CRUD hook (session-aware)

## Sessions (client-side state)

`configuration` mock returns `sessions[]`:

```json
{"name": "cart", "persist": true, "method": "array_upsert",
 "method_config": {"match_key": "id", "on_match": "increment",
                   "increment_field": "qty", "default_fields": {"qty": 1}}}
```

`AppProvider` → `buildConfigFromSessions()` → `useGenericState.configure()`
(zustand, `src/store/use-generic-state.ts`). `update("cart", product)` runs the
named strategy (`array_upsert`, `array_toggle`, `array_remove`,
`array_prepend_unique`, `replace`, `merge`) and persists to localStorage as
`<client>_gs_<name>`. `useEntity("cart")` detects registered sessions and
reads/writes the store instead of HTTP.

## Tenancy

- `componentsMap` in `src/tenants/index.ts` keys per client (`grocery`,
  `fashion`, `liquor`, `restaurant`) — all currently spread `default` + `admin`.
- Active client: `localStorage["vite-client"]` or `VITE_CLIENT` env
  (`getActiveClient` in api-provider).
- Mock merge order: `grocery` ∪ `default` ∪ `<client>` (later wins), per lang.
- `src/mock/<client>/mock.ts` uses `import.meta.glob` — must live physically in
  each client folder (Vite binds globs at build time).
- `config.json` (at `frontend/` root) = endpoint registry: `mock: true` plus
  optional `search_param`, `id`, `response_type`, `status`, `delay`.
- `CLIENT_STYLE_OPTIONS` in `src/mock/mock.ts` maps style ids →
  `style-config/<id>` endpoints per client.

## Multilingual (three layers)

1. **API/mock content** — `mock/<client>/<lang>/<endpoint>/...`; `apiClient`
   sends `lang`/`Accept-Language` headers and falls back to
   `default_language` ("en") when a localized file is missing.
2. **UI strings** — `useLanguage().t(key)` loads
   `mock/<client>/<lang>/translations/GET/success.json` (flat map; missing
   keys echo the key).
3. **Per-field localization** — `useLanguage().l(obj, "a.b")` reads
   `obj.translations[<lang>].a.b`, falling back to the base field.

Language persists in `localStorage["language"]`; `setLanguage` triggers a full
reload. Supported languages are hardcoded in `LANGUAGES`
(language-provider.tsx): `en`, `hi` — not config-driven.

## Theming

- Theme in `localStorage["vite-ui-theme"]`; options = `CLIENT_STYLE_OPTIONS`
  in `src/mock/mock.ts` (id → `style-config/<id>` endpoint + client).
- `setTheme()` also calls `setActiveClient()` — theme and tenant are coupled
  (picking "Liquor Black" switches mock data to `liquor`).
- `ThemeProvider` fetches `style-config/<theme>` via apiClient →
  `{styles: {primary: "152 70% 35%", ...}}` → sets each `--<key>` on `<html>`
  plus a `<style id="dynamic-style-config">` tag; adds `theme-<name>` class.
- `index.css` `@theme` maps vars to Tailwind v4 tokens
  (`--color-primary: hsl(var(--primary))`) — utilities repaint instantly.
- `useFormStyleStore` (persisted `nishify-form-style`) = separate layer for
  form field height/radius/sidebar knobs via `themeName`.
- New theme = one `style-config/<name>/GET/success.json` + one
  `CLIENT_STYLE_OPTIONS` entry.

## Admin

`/admin/:slug` → `Protected` (JWT in `localStorage.token`, `jwt-decode` expiry
check) → `DashboardRenderer` (`components/shared/dashboard-renderer`).

Admin screens are entity-driven — **the OPTIONS response IS the screen**:

1. `useDashboardRenderer` flattens `admin_menu` (respects `hide: true`) →
   `activePage.entity`.
2. `DashboardControl` (`tenants/admin/default-admin/utils/dashboard-control.tsx`)
   calls `OPTIONS /<entity>` via `useDashboardControl`.
3. OPTIONS returns a Definition of `type: "default-admin"` whose `content`
   carries `table.columns` (key/label/type/sortable/searchable/status
   variants), `table.actions` (`open_form`, `confirm_delete`), and
   `form.fields` (`componentType`: TextInput/NumberInput/Select/...,
   required, colSpan, options). If OPTIONS returns only `content`,
   DashboardControl synthesizes the definition itself.
4. `RenderEngine` → `default-admin` component → CRUD via
   `use-curd-entity.ts` (wraps `useEntity`: GET list, POST, PUT /:id,
   DELETE /:id; `onChangeHandle` → `reload` for page/sort/filter,
   500ms-debounced search, confirm dialog, `useProcess` loader).

New admin CRUD module = one OPTIONS JSON + one `admin_menu` entry — no TS.

`useAdmin` (`src/engine/hooks/use-admin.ts`) handles logout →
`config.admin.logout_redirect`.

## Shared component library

`nishify` in package.json = `fe-library-1.0.2.tgz` (committed tarball, package
name `fe-library`). `src/tenants/default/index.tsx` maps def types to library
components (`header`, `footer`, `hero-section`, `products`, `cart-view`,
`checkout`, `profile`, `login-layout-1`). To rebuild the tarball you need the
fe-library source repo — it is not in this workspace.

## Component convention: view + hook contract

Every component is two files: `<name>.tsx` (pure JSX, no logic) and
`use-<name>.ts` (all logic). The hook returns a standard shape:

```ts
{ handlers, states, uiRefs, config, ...domainData }
```

The view unpacks it and passes pieces to sub-components. The hook is the
integration seam — merges engine props (`content`, `controle`, `actionData`),
stores, theme, router, localStorage. Handlers prefer `controle.action(...)`
when the engine supplies it, falling back to `navigate()` etc.

**Components are engine-optional**: every engine input has a fallback
(`controle?` optional; `actionData?.data?.x || content`; store counts ??
engine counts ?? 0; `EngineContext` has a default `t: (s) => s`). Same
component runs standalone (e.g. `/playground`) or inside RenderEngine —
the hook auto-detects which mode it's in.

Examples: `use-header`, `use-footer`, `use-hero-section`,
`use-dashboard-control`, `use-curd-entity`, `use-public-render`,
`use-media-upload`.

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

- `npm run dev` — vite + mock server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint
