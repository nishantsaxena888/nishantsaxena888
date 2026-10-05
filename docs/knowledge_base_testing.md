# Knowledge Base — Testing & Regression

Teeno platforms (web / Electron / React Native) ka verification layer.
Same shared `fe/app/src` teeno pe chalta hai — tests engine ke contract
pakadte hain, platform-specific sirf boot path alag hai.

## Layers

| Layer | Command | Kya pakadta hai |
|---|---|---|
| **Static gate** | `./verify.sh` | python syntax, tsc, eslint, `validate-defs`, `check-mocks` |
| **Unit** | `cd fe/app && npm run test` | 202 Vitest — sessions, apiClient, RBAC, Protected gate, boundary reset, optimistic CRUD, auth refresh |
| **Web E2E** | `cd fe/app && npm run e2e` | 33 Playwright checks — route sweep ×4 clients, login→admin, order edit/add/delete, sessions, filters, Hindi |
| **Desktop E2E** | `cd fe/app && npm run e2e:desktop` | Real `electron/main.cjs` + `dist/` over `file://` — same path packed `.app` takes (hash routing) |
| **Mobile** | `cd fe/native && npm run test:mobile` | Maestro flows — launch + scroll/no-crash. Simulator chahiye (`maestro/README.md`) |

`e2e`/`e2e:desktop` apna server/build khud karte hain — self-contained,
koi manual step nahi. `E2E_BASE=http://localhost:5173` running server
reuse karta hai.

## Regression map — kaunsa test kis bug ko lock karta hai

| Bug (fixed) | Permanent check |
|---|---|
| InputDate string crash (`"2024-04-10"` pe `toLocaleDateString` throw) | e2e: `order edit form renders (date field safe)` |
| Infinite admin skeleton (`properties.actions` typo vs `action`) | `validate-defs` flags plural key; e2e: `"Loading Component"` sweep |
| Error boundary stuck after transient crash | unit: `resetKey` remount + Retry tests |
| `<tr>` mein `"0"` text node (empty `customActions` array) | e2e strict console-error check |
| `vite-client` override deleted before map loaded | KNOWN_CLIENTS manifest + e2e multi-client drive |
| Select uncontrolled→controlled flip | e2e console check fails on the Base UI warning |
| 401/expired token mid-session | unit: Protected bounce + api-auth refresh tests |

Naya bug fix ho to uska check ek line mein yahan add karo — e2e mein
`check()` call, ya unit test.

## Rules

- Mock mode mein network nahi jaata (`apiClient` intercepts) — DOM/text
  pe assert karo, `page.on('request')` pe nahi.
- Electron hash routing hai (`file://` pe) — test mein `location.hash`
  use karo, `pushState` nahi.
- Electron **persists Chromium profile + nav history** between launches —
  boot pe purana hash route restore ho sakta hai. `e2e-desktop.mjs`
  starts by pinning `#/` + reload; assertions wait for real DOM rows
  (`tbody tr`), fixed sleeps pe rely mat karo.
- `ELECTRON_RUN_AS_NODE` env kabhi Electron launch ko mat do — binary
  Node ki tarah exit kar deta hai (scripts already strip it).
- Admin sab clients pe `require_auth: false` hai (dev default) — gate
  logic unit tests mein covered hai, E2E login flow real token store
  verify karta hai.
