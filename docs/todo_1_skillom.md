# todo_1_skillom — Skillom Build Plan

> **Skillom** = the skill-development product (courses/labs/quizzes, Uday AWS
> style) built on the shared model: `nishify` backend + `ns` frontend engine +
> Uday AWS's markdown-content pattern. Built using all 3 docs —
> `nishify.md` (backend model), `ns.md` (frontend model), `uday_aws.md`
> (content/reader model). Points below trace back to "Nishant's Model"
> sections in each.

## Vision (one line)

Design entities → get API + admin + search + screens for free; content lives
in markdown; same engine, `skillom` tenant config → the product.

---

## 1. Backend — `nishify` (per `nishify.md` pts 1–4, 6)

- [ ] Create `clients/skillom/entities.py` — DSL draft:
  - Content: `course`, `module`, `lesson`, `section`, `media_asset`
  - Interactive: `quiz`, `question`, `quiz_submission`, `challenge`,
    `lab`, `lab_step`, `lab_note`
  - Learner state: `enrollment`, `progress`, `bookmark`, `certificate`
  - RBAC (pt 3): `user`, `group`, `group_permission_map`, `user_group_map`
    (student / instructor / admin groups)
  - Commerce-ready (implicit accounting): `order`, `payment`, `invoice` —
    if paid courses
- [ ] Relations: `module → course` (fk), `lesson → module` (fk),
  `section → lesson` (fk or ordered children), M2M `course↔tag`,
  `user↔group`, `enrollment(user,course)`
- [ ] `clients/skillom/elastic_entities.py` — index `course`, `lesson`,
  `lab` (searchable_fields: title, description, section text; `follow_fk`
  course→module for catalog search)
- [ ] Run `infra/code_generator.py skillom` → models, hooks, validators,
  tests, OPTIONS mocks
- [ ] `DB_NAME=skillom_db CLIENT_NAME=skillom ./reset.sh` → migrate + seed
- [ ] Implicit audit on write entities (audit__ pattern from pioneer)
- [ ] `last_updated_at`/`version` implicit on every entity (sync contract)

## 2. Auth + RBAC (pt 3)

- [ ] Keycloak realm `skillom` (copy `nish_auth` pattern — OIDC client)
- [ ] SSO → internal `user`/`group` mapping (decide: email vs `sub` claim)
- [ ] Permission config entities: group → entity perms (CRUD + row + column)
- [ ] `{{user_id}}`/`{{group_id}}` session conventions in query wrapper
- [ ] Row-level: learner sees own `progress`/`enrollment` only
- [ ] Column-level: instructor-only fields (answers, `correct_id`) hidden
  from student group — server filters OPTIONS + payloads

## 3. Content — markdown pipeline (per `uday_aws.md` pts 1–3)

- [ ] Lesson content as `.md` (28-section format or lighter) — served as
  entity `media_asset`/content source or static files
- [ ] marked + mermaid render (GitHub-reader core)
- [ ] Section types → components: `text|concept|lab|quiz|terminal|code|
  challenge` — decide JSON `Definition[]` vs md fences (` ```lab `) per
  "markdown is extensible" detail
- [ ] Heading slugs → bookmarks + TOC scroll + deep-links (`slugify`)
- [ ] Lab popup / details popup equivalents (filtered md views)
- [ ] i18n: content `en` first; UI strings config-driven

## 4. Frontend — `ns` (per `ns.md` pts 1–6)

- [ ] `skillom` tenant in `src/tenants` componentsMap (spread default + admin)
- [ ] `src/mock/skillom/<lang>/<endpoint>/...` mock tree — contract first
- [ ] Page definitions (JSON): catalog, course detail, lesson player,
  quiz runner, dashboard (learner progress), admin entities
- [ ] Session entities via `sessions[]` config: `progress`, `bookmark`,
  `recent` (local sources — cart-equivalent)
- [ ] New components if needed → go in `library/generic-marketplace`
  (component lib), app stays thin
- [ ] Theme: `style-config/skillom` + `CLIENT_STYLE_OPTIONS` entry
- [ ] Admin: OPTIONS-derived screens for all entities (`default-admin`)

## 5. Offline + sync (pt 5)

- [ ] Offline = local session sources serve (lessons cached after view)
- [ ] Delta sync contract `updated_at > last_sync` on progress/notes
- [ ] Tombstones (`deleted_at`) for deletes
- [ ] Conflict policy: progress = merge-max %, notes = last-write-wins (decide)

## 6. Package + multi-tenant build (pts 7–9)

- [ ] `skillom` build = `ns` repo + skillom config + component lib in
  package.json — same engine, brand-specific build
- [ ] Verify `file:` dep path for `library/generic-marketplace` (broken
  symlink today — `npm install` after path fix)

## 7. Stretch / later

- [ ] Entity designer UI ("studio" — DB design = running system)
- [ ] AI as a source (lesson generation, quiz gen) — undecided
- [ ] Desktop packaged app (Electron/Tauri) — open gap
- [ ] Certificates as derived artifact (write-through poster pattern)

---

### Open decisions (discuss before building)

1. Lesson content storage: entity rows vs .md files vs hybrid
2. Section components: JSON definitions vs markdown fences
3. Free vs paid at launch (accounting entities needed?)
4. Desktop app in scope for v1?
5. `fb layer` meaning in RBAC (filter-builder vs field-based)
