# Skillom — config-driven course platform client

Skillom is the reference implementation of a **course/CMS client** on the
generic engine: catalog → course → chapter reader, a markdown directive
model (ported from Uday_AWS), and a draft→review→publish workflow — all
declared in `be/client/skillom/` + `fe/client/skillom/`, zero engine
special-casing.

> **Generic promotion (branch `nishant`)** — `course-list`,
> `course-detail`, `chapter-reader` and `md-sections` now live in
> `fe/app/src/tenants/storefront/` (and `revision-pipeline` in
> `tenants/admin/admin.ts`), registered for EVERY client. Skillom and
> `uday` (the Uday_AWS replica) are both thin tenants: identical flows
> proven by the same e2e checks. A new course client needs only
> entities + configuration.json + page defs — route names, session
> names and labels are configurable per page via `content` keys
> (`detail_path`, `reader_path`, `back_path`, `progress_session`).

## Route / page model

| Route | Menu entity | Def | Component |
|---|---|---|---|
| `/` | `home` | mock/en/home | hero + course-list |
| `/courses` | `pages/courses` | `pages.courses` | course-list |
| `/courses/:id` | `pages/course` | `pages.course` | course-detail |
| `/learn/:id` | `pages/learn` | `pages.learn` | chapter-reader |
| `/my-learning` | `my-learning` | mock page | session-list ×3 |
| `/admin/review-queue` | `review-queue` | OPTIONS `config` | revision-pipeline |

Parameterized routes work through the stock `/:slug/:id` router +
`useDynamicData` interpolation — `endpoint: "course/:id"` resolves from
route params; the mock layer answers detail-reads (`entity/:id` → single
record from `items`).

## Data flow

```
be/client/skillom/entities.py        — DSL: fields, ui, sample_data
be/client/skillom/seed/<entity>.json — bulk data (overrides sample_data)
be/client/skillom/configuration.json — menu/pages/sessions/themes
        │  python be/tools/gen_mocks.py skillom
        ▼
fe/client/skillom/mock/…             — endpoint tree + config.json registry
```

`gen_mocks` also flags menu entities that aren't entities/pages/sessions
(home, login, register, my-learning) — GET for public pages, +POST/OPTIONS
for `auth_page` entries — and only writes stub files that don't already
exist, so hand-authored page mocks survive regeneration.

## Markdown directives (tenants/storefront/md-sections.ts)

`parseMd(md)` → typed `MdSection[]`. Blocks: headings, paragraphs,
code fences, lists, images, blockquote callouts. Embedded JSX-style
directives keep document position via `@@MDSEC:N@@` sentinels:

- `<Quiz …/>` — interactive quiz (options/answerIndex/explanation)
- `<InfoCard|TipCard|WarningCard|…>body</Tag>` — callout variants
- `<VideoSection youtubeId=…>` — thumbnail + link
- `<HotspotImage>`, `<ImageGallery>`, `<CodeExecutionPlayer>` — widgets
- `<GitHubExplorer|CodeExplorer|Conversation|FlowDiagram>` — degrade to
  attr-driven cards (live repo fetch is a deliberate gap for now)
- unknown self-closing widgets — attr callout fallback, never a crash

Attrs support `"quoted"`, `{literal}` (`{[…], {k:v}, scalars}` via a
recursive-descent `evalLiteral` — **no `new Function`, Hermes-safe**).

## Engine additions made for this client (all generic)

- `useDynamicData` — `lazy: true` actions skip the mount batch and don't
  count toward the skeleton (write actions must never fire on load).
- Action data merges into `:param` interpolation — `PUT revision/:rid`
  resolves `rid` from `action({key, type:"filter", data:{rid}})` args.
- `gen_mocks` — `seed/<entity>.json` data source; menu-entity registry.
- vitest includes `../client/**/*.test.*`; tsconfig maps `vitest` so
  client-folder tests typecheck.
- `ensureClientMocks` — in-flight dev mock loads are tracked by promise
  (a done-set raced: requests fell through to a live backend and were
  served the WRONG tenant's configuration).

## CMS workflow

`review-queue` entity's OPTIONS returns a `config` def (not a table) →
admin renders `revision-pipeline`: four status columns, transitions via
lazy PUT, and **rollback = POST new revision copying old md** (published
history immutable, audit preserved). `course_release.snapshot`
({chapter: revision}) freezes a full course for export/restore.

## Importing course content

```
python be/tools/import_uday_content.py ../Uday_AWS [client]   # default skillom
python be/tools/gen_mocks.py <client>
```

Reads docsRegistry (categories→courses→chapters) + courseRegistry
(47 modules) + md files → seed JSONs (id offsets: cats 10+, courses 100+,
chapters/revisions 1000+; hand seed stays 1-99). `chapter.content_base`
carries the asset prefix so relative md images resolve at serve time.
Current import: 56 courses / 454 chapters — all browsable via the same
generic read path.

## Client-boundary rules honored

Components import only `@/platform/*` + same-folder relatives; session
writes go through the `session` prop (SessionBridge), mutations through
`actionData.action` — no `@/engine` imports.

## Verified

- `verify.sh` — 212 unit tests incl. md-sections + lazy-action contracts
- `npm run e2e` — route sweep + catalog→detail→reader→quiz→progress flow
  + review-queue board with approve transition
