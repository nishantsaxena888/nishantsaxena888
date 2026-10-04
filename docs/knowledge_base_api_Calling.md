# Knowledge Base — API Calling (apiClient)

How the frontend calls the backend — contract, source optionality, mock levels.

## Core idea

**One call path for everything.** Every component/hook calls
`apiClient(endpoint, options)` — it never knows or cares where data comes
from. The *source* is optional/configurable; the *contract* is fixed.

```
apiClient("todo", {method:"get"})
        │
        ▼
  source selection (per config)
        │
  ┌─────┼──────────────┬──────────────┐
  │ mock files         │ real API      │ future: local sources
  │ (dev, per-flag)    │ (axios)       │ (IndexedDB, sessions)
  └─────┴──────────────┴──────────────┘
        │
        ▼
  ApiResponse — SAME shape always:
  { data, details?, error, status_code, message }
```

This is the client-side mirror of the backend `Source` contract —
apiClient is the SourceRouter; config picks which source answers.

## Call signature

```ts
apiClient(endpoint, {
  method: "get" | "post" | "put" | "patch" | "delete" | "options",
  payload,               // body
  id,                    // appended to URL
  searchParameter,       // query params
  header,                // extra headers (merged, overrides defaults)
  responseType,          // json/blob/...
  preFix = "/api",       // url prefix
})
```

URL = `base_url + preFix + /endpoint + /id`.
`base_url` = `VITE_API_URL` (vite proxy → `be` service in dev).

**Auto headers:** `lang` / `Accept-Language` (active language),
`Authorization: Bearer <token>` from `localStorage.token` (skipped if a
custom Authorization header is passed).

`batchApiClient(requests[])` = parallel calls, same response shape per item.

## Mock optionality — 3 levels (ns config.json model)

`config.json` = endpoint registry. Flag = source selection.

```json
"todo": {
  "GET":     { "mock": true },
  "OPTIONS": { "mock": true },
  "POST":    { "mock": true },
  "PUT":     { "mock": true },
  "DELETE":  { "mock": true }
}
```

1. **Overall** — nothing flagged → everything real API (absence = off;
   no global switch needed)
2. **Entity level** — flag only `todo` → todo mocked, rest real
3. **Operation level (within entity)** — `todo.OPTIONS` mocked while
   `todo.GET/POST/...` real → mixed mode (e.g. read mock, write real)

**Per-method extras:** `id` (match specific record), `search_param`,
`response_type` (`success` | `error` | `error1`), `status`, `delay`.

**Semantics:** `mock:true` + file present → mock served.
`mock:true` + file **missing** → `404 "Mock data not found"`, does NOT
silently fall back to real API (by design — a broken mock promise is an
error, not a fallback). Real-API fallback happens only when the endpoint
isn't flagged at all.

Mock files live per-client per-lang:
`mock/<client>/<lang>/<endpoint>/<METHOD>/<response_type>.json`,
merged `default ∪ <client>` (client wins), `default_language` fallback.

## Current state in fe/app

- Mock system is **stripped** (user decision): api.ts is pure axios,
  api-provider merges nothing, themes/translations read real endpoints.
- Restoration is verbatim-from-ns: `config.json` registry +
  `loadMockData.ts` + the routing block in `api.ts` + per-client mock
  trees (which would live under `fe/client/<name>/mock/`).

## Backend contract (what apiClient expects)

| Call | Endpoint | Returns |
|---|---|---|
| list | `GET /api/{entity}/?q=&page=&size=&sort=&f__op=` | `{items,page,size,total}` |
| get | `GET /api/{entity}/{id}/` | row |
| create | `POST /api/{entity}/` | row |
| update | `PUT /api/{entity}/{id}/` | row |
| delete | `DELETE /api/{entity}/{id}` | `{ok}` |
| options | `OPTIONS /api/{entity}/` | `{entity,schema,content}` — content IS the admin screen |
| configuration | `GET /api/configuration` | `{meta,admin,menu,admin_menu,language,sessions,themes,style-configs,pages}` |
| page def | `GET /api/pages/{slug}` | `{meta,config:Definition[]}` |
| theme vars | `GET /api/style-config/{name}` | `{styles:{--vars}}` |
| translations | `GET /api/translations` | `{key:label}` flat map |

## Consumers (don't care about source)

- `useEntity` — CRUD hook (session-aware: local sessions intercept)
- `useDashboardControl` — OPTIONS → default-admin screen
- `usePublicRender` — menu entity → page definitions
- `AppProvider` — `configuration` → config store + session setup
- `ThemeProvider` — `style-config/<theme>` → CSS vars
- `useDynamicData` — def `properties.action[]` → actionData
