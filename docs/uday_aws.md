# `Uday_AWS` — AWS Production Masterclass Platform

> Interactive AWS learning platform: a **data-driven static frontend** (vanilla
> JS, no build step) served by a **FastAPI backend** that persists
> progress/quiz/lab-note state to Postgres (or SQLite). All lesson content
> lives in JS data files — the backend never serves content.

## Repo Facts

| | |
|---|---|
| Local path | `/Users/nishantsaxena/workspace/Uday_AWS` |
| Remote | `git@github.com:nishantsaxena888/Uday_AWS.git` (**GitHub**) |
| Active branch | `main` |
| Backend | FastAPI + SQLAlchemy (async), Postgres 15 or SQLite fallback |
| Frontend | Vanilla JS + Web Components, NO bundler, plain `<script>` tags |
| Content | **49 modules** (was 47 — Linux + FDE added), 28-section chapter markdown |
| Deploy | Dockerfile → uvicorn :8080; `render.yaml` (Render.com + managed Postgres) |

## Repo Layout

```
Uday_AWS/
├── backend/                    # FastAPI + SQLAlchemy (async)
│   ├── app.py                  # App entry: routers + StaticFiles mount at /
│   ├── database.py             # Engine/session; DATABASE_URL → asyncpg, else SQLite fallback
│   ├── models.py               # ORM (user_progress, quiz_submissions,
│   │                           #   challenge_submissions, user_notes) + Pydantic schemas
│   ├── requirements.txt        # includes greenlet (required by sqlalchemy asyncio)
│   └── routes/                 # health, courses, progress, quizzes, sandbox, labs
├── aws-lambda-masterclass/     # Frontend (vanilla JS, NO build step)
│   ├── index.html              # Landing page → app.initLanding()
│   ├── component-library.html  # Storybook-style catalog for MasterclassUI
│   ├── lab-server.cjs          # Alt Node server (:8081); /api/lab now also in FastAPI
│   ├── chapters/               # 49 copies of Chapter_XX_*.md (fetched by popups)
│   ├── modules/module-XX.html  # 49 near-identical page shells
│   ├── css/                    # design-system.css (tokens + [data-theme=dark])
│   └── js/
│       ├── shared.js           # MCUtils, MCChapters, MCI18n, MCTheme — LOAD FIRST
│       ├── app.js              # App controller (window.app)
│       ├── data/courses.js     # COURSE_REGISTRY — 49 modules, metadata, achievements
│       ├── data/module-XX-*.js # MODULE_XX_DATA — actual lesson content per module
│       ├── engine/             # render engines + api-sync (see below)
│       └── components/         # masterclass-ui.js facade + web-components.js (<ui-*>)
├── Chapter_XX_*.md             # Source markdown (48 at root; Chapter_48 lives
│                             #   only in chapters/ — root copy missing)
├── Dockerfile                  # python:3.11-slim → uvicorn :8080
├── docker-compose.yml          # postgres:15 (host :5433) + web (:8080)
├── render.yaml                 # Render.com blueprint (Docker + managed Postgres)
├── AWS_Services_Summary.md     # content summary doc
└── COLLEGE_HARDWARE_LAB_PROPOSAL_AND_SOPS.md  # latest commit: hardware lab proposal
```

## How to Run

```bash
# Full stack (recommended)
docker compose up --build            # → http://localhost:8080

# FastAPI only (SQLite fallback → data/masterclass.db)
pip install -r backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8080 --reload

# Static + lab-note persistence (legacy alternative; FastAPI covers it now)
cd aws-lambda-masterclass && node lab-server.cjs   # → http://localhost:8081

# Static only (everything degrades to localStorage)
cd aws-lambda-masterclass && python -m http.server 5500
```

Useful endpoints: `/docs` (Swagger), `/health`, `/api/progress/summary`,
`/api/lab/:moduleId`, `/components` (component catalog).

## Shared Foundation (`js/shared.js`) — load before ALL engines

Four globals, one file, loaded first in every page:

| Global | Provides |
|---|---|
| `MCUtils` | `escapeHtml`, `slugify`, `injectStyles`, `loadScript`, `loadMarked`, `loadMermaid`, `renderMermaid`, `createModal` (+ shared `.mc-modal-*` / `.md-rendered` CSS) |
| `MCChapters` | single `MD_MAP` (module → chapter file), `currentModuleId/Title`, `fetchMarkdown`, `stripPracticalLabs`, `extractPracticalLabs` |
| `MCI18n` | `t(key, vars)`, `setLocale`, `localizeDocument` (`data-i18n`/`data-i18n-placeholder`), dicts `en`,`hi` — `localStorage['mc-locale']` |
| `MCTheme` | `apply/toggle/get`, `localStorage['mc-theme']`, `prefers-color-scheme`; auto-adds 🌙/☀️ toggle + locale picker to `.topbar-actions` |

Dark theme lives in `design-system.css` under `[data-theme="dark"]` — inverts
the neutral ramp + semantic tints. White text on colored surfaces uses
`--text-on-accent` (not `--color-neutral-0`).

## Frontend Architecture

- **No framework, no bundler.** Global classes on `window`. Script load order
  in each `modules/module-XX.html`:
  `shared.js → progress-engine → interactive engines → lesson-engine →
  courses.js → module-XX data → lab-popup → details-popup → api-sync → app.js`,
  then inline `app.currentModule='module-XX'; app.initModule(MODULE_XX_DATA)`.
- **Render pipeline**: `LessonEngine` walks `data.sections[]` dispatching on
  `section.type`:
  - raw HTML: `text | why | concept | expected-output | what-happened | cleanup`
  - `architecture` → DiagramEngine (SVG)
  - `lab` → LabEngine (step machine)
  - `console` → ConsoleSimulator (guided clicks, `.console-clickable` + `data-action-id`)
  - `terminal` → TerminalEngine (regex command registry)
  - `code` → CodeEditorEngine (`languages[]` + `explanations`)
  - `command` → CommandBlock (copy/run/explain/errors)
  - `troubleshooting`/`interview` → accordions
  - `quiz` → QuizEngine (`correctId` client-side)
  - `challenge` → ChallengeEngine (keyword matching or custom `validator`)
  - `next` → nav links
- **Progress**: `ProgressEngine` → `localStorage['aws-masterclass-progress']`;
  section → lesson → module → mastery tiers (beginner/intermediate/advanced/
  production-ready at 40/70/90%). `app.initModule` calls
  `progress.registerLesson(moduleId, lessonId, [real section IDs])` so
  completion math uses the data file's real sections, not registry stubs.
  `api-sync.js` attaches via `attachToProgressEngine` and POSTs
  `/api/progress/sync` on every change (graceful no-op offline).
- **Achievements**: 8 in `COURSE_REGISTRY.achievements`; granted by
  `ProgressEngine._checkAchievements()` on every save.
- **Markdown popups**: `details-popup.js` ("Detailed Chapter") renders chapter
  minus lab sections; `lab-popup.js` ("Lab Notes") renders only lab sections
  as accordions + a contenteditable notes editor POSTing `/api/lab/:moduleId`
  (works on BOTH FastAPI and lab-server.cjs; localStorage fallback offline).
  All markdown/mermaid/MD_MAP/modal plumbing is in `shared.js` — do not re-add
  `MD_MAP` copies.

## Conventions

- **Adding a module**: create `js/data/module-XX-<slug>.js` exporting
  `MODULE_XX_DATA`, copy a `modules/module-XX.html` shell (update title +
  script src + `app.currentModule`), add registry entry in `courses.js`, add
  `MCChapters.MD_MAP` entry in `js/shared.js` (ONE place), copy
  `Chapter_XX_*.md` into `aws-lambda-masterclass/chapters/`.
- **Screenshot images**: chapter markdown references `image-N.png`; `<img>`
  srcs resolve relative to the *page* URL (`/modules/module-XX.html`), so new
  images MUST land in `aws-lambda-masterclass/modules/` — copies at repo root
  don't render. (Duplicated copies exist; the modules/ one is load-bearing.)
- **Adding a section**: append `{id, type, title, content}` to
  `MODULE_XX_DATA.sections`; per-type content shape documented in each
  engine's constructor JSDoc.
- **UI strings**: route through `MCI18n.t('namespace.key')` + add to `DICTS`
  in `shared.js`; static shell text uses `data-i18n` (auto-applied by
  `localizeDocument`).
- **Escaping**: always `MCUtils.escapeHtml` — engines delegate `_escapeHtml`
  to it; don't add new copies.
- **Style**: CSS custom properties (`--color-*`, `--space-*`, `--radius-*`,
  `--text-on-accent`); engines inline most styles — prefer tokens so dark
  theme works.
- **Commits**: short imperative messages.

## Backend

- `app.py` mounts routers + `StaticFiles` at `/` — one process serves API and
  the entire frontend.
- `database.py`: `DATABASE_URL` set → asyncpg (Postgres); else SQLite fallback
  (`data/masterclass.db`).
- `models.py`: `user_progress`, `quiz_submissions`, `challenge_submissions`,
  `user_notes` + Pydantic schemas.
- Routes: `health`, `courses`, `progress` (`/api/progress/sync`, `/summary`),
  `quizzes`, `sandbox` (Python subprocess executor), `labs` (`/api/lab/:moduleId`).
- `user_id` = random localStorage ID (`masterclass-user-id`) — no auth;
  progress doesn't follow users across devices.

## Known Gaps / Caveats (verified)

- Registry `lessons[].id` (e.g. `rds-overview`) does NOT always match the
  data-file lesson `id` (e.g. `rds-fundamentals`) — live registration handles
  it; a schema validator would be the real fix.
- 49 module shells still duplicate the same ~15 script tags — a shared
  loader/build step remains the biggest DRY win.
- Quiz grading is client-side (`correctId` in JS); backend trusts
  `correct_option` in the request body.
- `ChallengeEngine` does string matching, not code execution.
- Sandbox executes Python subprocesses behind a small blacklist — bypassable.
  **Do not expose publicly as-is.** CORS is `allow_origins=["*"]` with
  `allow_credentials=False` (valid, but open).
- Two lab-note persistence paths exist (FastAPI `/api/lab` + `lab-server.cjs`)
  — pick one eventually.
- i18n covers UI chrome only (~100 keys); lesson content is English-only.
  `setLocale` reloads the page (engines render once).
- Dark theme: engines still contain some hardcoded hex in inline styles;
  `.lab-content-toggle` pastel greens get explicit dark overrides in
  design-system.css — extend that block when adding hardcoded colors.
- Root is missing `Chapter_48_Linux_Command_Line.md` (exists only in
  `chapters/`; the chapters/ copy is the load-bearing one anyway).
- There are **no tests** in the repo.

## Verification

No test suite. Quick smoke:

```bash
uvicorn backend.app:app --port 8090 &          # SQLite, no docker needed
curl localhost:8090/health
curl localhost:8090/api/courses/info           # total_modules: 49
curl localhost:8090/api/lab/module-06          # {"content":""}
node --check js/shared.js                      # syntax check any JS change
```

Open `http://localhost:8080/modules/module-XX.html`, check browser console
for JS errors, confirm engines render, theme toggle 🌙 appears top-right,
and hit `/docs` for API checks.

## Related Docs

- `AGENTS.md` (repo root — condensed version of this file)
- `AWS_Services_Summary.md`, `COLLEGE_HARDWARE_LAB_PROPOSAL_AND_SOPS.md`
- Sibling docs: `ns.md` (frontend engine), `nishify.md` (entity platform)
