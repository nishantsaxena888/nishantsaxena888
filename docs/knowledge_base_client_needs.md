# Knowledge Base — New Client Checklist (A–I)

Naye client ko kya chahiye — letter scheme (Nishant's naming).

| # | Cheez | Kahan hai |
|---|-------|-----------|
| **A** | **Layout** — menus, pages, app shell | `be/client/<name>/configuration.json` → `menu`, `pages` |
| **B** | **Admin** — OPTIONS-driven screens, admin_menu | `configuration.json` → `admin_menu` + entity OPTIONS |
| **C** | **Components** — client ke apne | `fe/client/<name>/components/` + `tenant.ts` (componentsMap merge) |
| **D** | **API Calling** — apiClient contract, sources | `fe/app` engine (fixed); mock optionality per config |
| **E** | **Theme/Style** | `configuration.json` → `themes` + `style-configs` |
| **F** | **i18n** — languages + translations | `configuration.json` → `language` + `/api/translations` |
| **G** | **Sessions** — local state sources | `configuration.json` → `sessions[]` |
| **H** | **Auth/RBAC** | `configuration.json` → `admin.require_auth` (flag now; SSO/RBAC later) |
| **I** | **Branding/Meta** — name, logo, currency | `configuration.json` → `meta` |

**0th (base):** `entities.py` — data model, B ka base. Iske bina kuch nahi.

## New client recipe

```
be/client/<name>/
  entities.py          ← 0: DSL (fields, ui, source, sample_data)
  configuration.json   ← A,B,E,F,G,H,I sab yahin

fe/client/<name>/
  tenant.ts            ← C: componentsMap entry (fe/app/src/tenants/index.ts mein merge)
  components/          ← C: apne components
  mock/                ← (optional, baad mein) per-client mock trees
```

`fe/app` + `be/app.py` + `be/sources.py` = frozen generic — touch nahi.

## Later

- Offline/sync contract (per-client or global)
- RBAC config (entities) once implemented
