# AGENTS.md — agent contract for this repo

White-label multi-tenant platform. **One generic engine + per-client folders.**
Any coding agent (Antigravity, Devin, etc.) can continue work using this file
plus `fe/app/AGENTS.md` (the engine's hard rules — read it before touching
`fe/app/src`).

## Golden rule

> Shared code is generic and frozen-ish. Client work = files inside
> `fe/client/<name>/` + `be/client/<name>/` ONLY. If a feature needs engine
> changes, make it config/data-driven so every client benefits.

## Repo map

```
fe/app/            generic engine (Vite + React + TS). Single package.json.
  src/common/      shared infra used by BOTH surfaces (site + admin):
    platform/      portability seams — primitives, navigation, storage,
                   host, env, toast, icons, asset, report, mermaid
                   (web impls + .native.* RN variants; Metro resolves)
                   sdk.ts = client SDK — still imported as @/platform/sdk
                   (alias stays stable for fe/client); the ONLY engine
                   surface fe/client/* code may import
    engine/        render-engine, apiClient (mock→axios), use-entity CRUD,
                   sessions reducers, use-dynamic-data, rbac
    store/         config-store + generic-state sessions
    hooks/ lib/    generic utils (cn, toast, confirm-dialog…)
    types/ test/   contracts + test stubs
  src/components/  surface-split UI:
    admin/         admin-only (shell, core-component widgets, form-render,
                   iterator, typography-renderer)
    site/          site-only (public-renderer, home-page, dynamic-page,
                   site-nav, loaders)
    shared/        pure-common comps (providers, language-selector,
                   form-input registry, loaders)
    third-party-shadcn/  vendored shadcn lib (components.json points here)
  src/tenants/storefront/   component KIT (header, listing, course-list,
                   course-detail, chapter-reader, slide-engine,
                   session-list, entity-actions…) — template only, copied
                   into clients by `npm run client -- --new`; NOT a
                   runtime fallback
  src/tenants/layout/, src/tenants/admin/   layout kit + generic admin
  src/pages/       public/ (site) + protected/ (admin guard) + common
  src/native/      Expo entry (site screens only)
  electron/        desktop shell — loads dist/ over file://
fe/client/<name>/  configs/client.json (manifest)
                   web/ (tenant.ts + components/ = ALL site comps,
                   client-owned kit copies included + styles.css)
                   layouts/ (tenant.ts + components/ layout copies)
                   admin/ (tenant.ts; {} = generic admin)
                   mock/ (per-lang API tree: <lang>/<endpoint>/<METHOD>/
                   success.json + config.json registry)
                   FULL ISOLATION — no shared component fallback
fe/native/         Expo app (site surfaces; admin is DOM-only)
be/app.py          generic entity service (FastAPI)
be/sources.py      JsonSource/SqliteSource/HttpSource
be/client/<name>/  entities.py (fields + ui + rbac + sample_data)
                   configuration.json (menu, admin_menu, pages, sessions,
                   themes, language[], roles, rbac, meta)
be/tools/          gen_mocks.py, import_uday_content.py
docs/              knowledge base + antigravity-course-translation-prompt.md
verify.sh          one-shot gate (tsc + lint + unit tests)
```

## Clients (5)

| Client | Domain | Site routes | Notes |
|---|---|---|---|
| `hello` | smoke test | `/` | scaffold sanity |
| `grocery` | e-commerce | `/`, `/shop`, `/deals`, `/cart`, `/checkout`, `/my-account`, auth routes | ⚠ don't run `gen_mocks.py grocery` — mock tree is hand-edited, regen clobbers |
| `airbnb` | stays | `/`, `/stays`, `/stays/:id`, `/wishlist` | |
| `uday` | learning | `/`, `/courses`, `/courses/:id`, `/chapter/:slug`, `/my-learning`, `/guide` | AWS Masterclass replica — 47 modules, typed `sections[]` slide engine |
| `skillom` | learning | `/`, `/courses`, `/courses/:id`, `/learn/:id`, `/my-learning` | same engine, different route shape |

## Commands

```bash
cd fe/app && npm run dev                    # web (multi-client lazy dev)
cd fe/app && npm run client -- <name>       # switch active client (prod path)
cd fe/app && npm run electron               # desktop app (dist/ must exist:
                                            #   npm run build:desktop first)
cd fe/native && npm install && npm run start  # Expo — i/Android/Expo Go
cd be && CLIENT_NAME=uday .venv/bin/python -m uvicorn app:app --port 8100
```

## Verify (run before every commit)

```bash
./verify.sh            # tsc + lint + unit — must say ALL CHECKS PASS
cd fe/app && npm run e2e            # 60+ checks, all 5 clients — ALL E2E PASS
cd fe/app && node scripts/check-mocks.mjs
```

## Contracts an agent must not break

- **Raw DOM forbidden** in shared/client comps — use `View/Text/Pressable/
  Anchor/TextInput/Image/ScrollView` (`as=` for semantic tags). SVG
  internals + `br` are the allowed exceptions.
- Nav via `useNav()`/`useRouteParams()`/`usePath()`/`Anchor` only.
- Persistence via `platform/storage`; cross-cutting via `emitAppEvent`/
  `onAppEvent`/`reloadApp`; errors via `platform/report`.
- Client code imports: React + relative + `@/platform/*` + type-only
  (`src/tenants/types.ts`). eslint enforces.
- UI strings: `t()`/`makeTr(key, fallback)` + `content.*` config + slide
  `labels` prop. **No literals in components.**
- Dynamic data: `properties.action[]` in page defs → `actionData`; param
  changes (`:id`) auto-refetch; `action({key,type:"reload"})` refreshes.
- Sessions: configured names only (progress/bookmark/recent/quizzes/labs/
  commands/cart…), via the `session` prop bridge.
- RBAC: `entities.py` `rbac` {read,write} → OPTIONS → `useEntity.can()`;
  RowActions via def `row_actions`/`card_actions`. Backend enforces.
- Themes: `configuration.themes` + `style-config/<theme>` mock → CSS vars
  on `:root` + `theme-<name>` class on `<html>` (dark overrides live in
  client styles.css).
- Languages: `configuration.language[]` — currently en/hi/es/de/bn for
  uday+skillom. Per-endpoint mock fallback to `en`; translated trees land
  at `mock/<lang>/...` (see `docs/antigravity-course-translation-prompt.md`).

## Uday reader architecture (parity target = ../Uday_AWS)

- `pages/learn` def → `chapter-reader` (fixed topbar 56px + fixed sidebar
  280px + 900px lesson container + right TOC ≥1440px, off-canvas ≤1024px)
- Chapter records carry `sections[]` (typed: why/concept/architecture/
  code/command/terminal/lab/quiz/challenge/troubleshooting/interview/next/
  text/html) → `slide-engine.tsx`. Doc chapters without sections fall back
  to markdown (`md-render`).
- Progress: `sec-<chapter>-<section>` items in `progress` session → orange
  % badges per module; scrollspy TOC; stale-while-revalidate nav.
- Mobile: zero horizontal overflow at 390–1440px is a hard requirement —
  check `document.documentElement.scrollWidth === innerWidth` per route.

## Known gaps / backlog

- es/de/bn (and hi content) translations — Antigravity task spec in docs/
- Doc-chapter page shell (non-module chapters) uses generic markdown mode;
  original has a distinct layout — polish optional
- Mermaid renders as code fallback on native (web-only lib by design)
- `grocery` mocks are hand-maintained — see warning in Clients table

## Commit style

Short imperative subject (see `git log`), `Generated with Devin` trailer.
Push to `origin/nishant` only when asked or as part of the task.
