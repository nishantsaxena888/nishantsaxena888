# `nishify` — Entity-Driven Multi-Tenant Platform Monorepo

> The **backend + platform** of the ecosystem. One Python/FastAPI service turns
> per-tenant entity **definitions** into a full REST surface — routes, SQLAlchemy
> models, Pydantic schemas, filters, search — all generated from data. Each
> tenant gets its own database and its own Elasticsearch indices. The `ns`
> frontend (see `ns.md`) is the primary consumer.

## Repo Facts

| | |
|---|---|
| Local path | `/Users/nishantsaxena/workspace/nishify` |
| Remote | `https://github.com/nishantsaxena888/nishify.git` (**GitHub**) |
| Active branch | `nishant-skillom` |
| Backend stack | Python, FastAPI, SQLAlchemy 2.x (sync), Alembic, Postgres, Elasticsearch 9 / OpenSearch (Bonsai) |
| Auth | Keycloak on Heroku (`nish_auth/`) |
| Frontend(s) | `nishify.io` (Next.js), `nishify.ai` (dreamspos), `nishified`, `property` (Vite), `ns` repo (engine) |

## Nishant's Model

### Points

1. Everything is a source; how it's implemented is secondary — even UI sessions (checkout, add-to-cart) are sources.
   e.g. FTP, session, Postgres, Elasticsearch, JSON files, remote APIs, scrapers.
2. Every source's data is represented by an entity, which is derived by options + CRUD, and should have implicit RBAC on it in the middle layer.
   > Note: entity = options schema (fields, `ref`/`ui`, FKs, defaults) + the CRUD
   > contract — the meta travels through `Source.options(entity, schema)`. RBAC
   > is not implemented yet; the vision is it sits in the middle layer (SourceRouter),
   > between the source and consumers.
3. RBAC itself is implemented entirely as a combination of entities, plus extensible SSO (Keycloak, Cognito, Strata etc.) for authentication + authorization; permissions are implicit, handled by configuration entities — row-level and column-level, with conventions like `{{user_id}}` resolved from session; the query wrapper applies them — if configured, implicit validation must be enforced on the fb layer for RBAC.
   e.g. user belongs to a group, and the group has row-level + column-level permissions configured on the entity — entity has 5 columns but the group may only see 4.
4. All sources are cloud-agnostic and local-compatible — same contract, any provider:
   - AWS → S3, RDS
   - Google → BigQuery
   - In-house → memory, etc.
5. React will be the frontend — mobile, desktop and web responsive using shadcn; it will be multilingual and multi-theme enabled, with offline mode and implicit sync.
6. The API layer is derived from options — layout, templates, everything derives from options, including authentication, authorization, multi-tenancy — all of it.
7. Everything is configurable — UI, styling, libraries — and we build a combined library and plug-and-play with it, so anything can be built: Airbnb, grocery, e-commerce, skill development (like Uday AWS) — anything.
8. Whatever we build — the entity builder itself, projects — is also an entity in itself, like RBAC.
9. The same site can serve different sites — change the config and the component library in package.json and rebuild: multi-tenancy via build only.

### Details

> **Knowledge base (discussion + Devin's understanding — for implementation):**
>
> - **Source coverage**: Postgres, Elasticsearch, JSON files, local files (FTP),
>   remote APIs, scrapers, UI session state (cart/checkout). NOT sources in this
>   model: config/DSL. Undecided: AI models.
> - **Entity derivation** (pt 2): an entity = `options` schema (fields, types,
>   FK refs, UI hints) + `CRUD` operations. Both served through the Source
>   contract — `Source.options(entity, schema)` carries the meta.
> - **RBAC resolution chain**: user → group → group's configured permissions on
>   the entity → resolves into three enforcement levels:
>   1. **Entity/operation level** — is CRUD allowed for this role on this entity?
>   2. **Row level** — which records? conventions like `owner_id = {{user_id}}`
>      inject session values into the WHERE clause at query time.
>   3. **Column level** — which fields read/write? 5 columns → group may see 4.
> - **Enforcement is implicit**: the query wrapper in the middle layer
>   (SourceRouter) applies RBAC automatically on both sides — filters going in,
>   masking coming out. If configured, validation is mandatory, not opt-in.
>   Consumers never hand-check permissions.
> - **RBAC config is itself entities**: user, group, group_permission_map etc.
>   are normal entities served via the same contract — the access-control
>   system is built out of the platform's own primitives.
> - **Open gaps to design later**: per-column read-vs-write split; custom
>   actions beyond CRUD (e.g. "approve"); meaning of "fb layer" (filter-builder?);
>   where SSO identity maps to the internal user/group entities.
> - **Admin is implicit, not built** (proof of pt 6): DSL fields already carry
>   `kind`/`ref`/`ui` hints → `/api/{entity}/options/` serves them → a generic
>   dashboard renderer (ns `default-admin`) produces the table/form/filters.
>   New entity = admin screen for free, zero frontend code. `code_generator`
>   also emits `frontend.admin.config.json` + OPTIONS mocks; `/api/studio`
>   exposes the whole DSL blob for studio tooling; `/api/inventory_filter/`
>   serves filter schemas. RBAC entities (user/group) get the same treatment —
>   the admin administers itself.
> - **DRF analogy**: like Django REST Framework's `ModelViewSet` derives
>   list/retrieve/create/update/destroy + serializer + validation from one
>   model declaration — the entity DSL derives CRUD API + ORM model + OPTIONS
>   schema + validation + filters + search wiring. Difference: DRF derives up
>   to the API; nishify's options contract goes one step further and derives
>   the UI (admin screens) too. Options = serializer + viewset + admin in one.
> - **Working admin reference** (verified in repo): `nishify.io` has
>   `src/app/admin` + `src/app/dashboard` + `src/components/admin` with
>   per-client `frontend.admin.config.json` (demo, property, pioneer_fresh,
>   pioneer_wholesale_inc, pioneer — all codegen output); `property` app has
>   `src/components/admin` + `pages/dashboard`; `mdm` has built-in Django
>   admin. Three separate admin UIs, one derivation model.
> - **Design entities, get everything implicit** (extends pts 1–2): we only
>   design entities — one-to-one, one-to-many, many-to-many relations via
>   `foreign_key`/`connection` — and CRUD, filters, validation run implicitly.
>   Indexing to ES is one source writing to another source, and it's
>   configurable per entity — so API/DB responses, sessions, server-side
>   caching, real-time indexing are all handled out of the box.
> - **ns endgame = components as a package** (pt 7 proof): `frontend/package.json`
>   already repoints `nishify` dep → `file:../../library/generic-marketplace` —
>   the component library's full source (own components/engine/tenants, vite
>   build, `fe-library-1.0.x.tgz` packs) now lives vendored in the ns repo.
>   Target split: app repo = engine + config + mocks + tenant glue only;
>   components = the `nishify` npm package. Layouts are JSON definitions +
>   `componentMap` + `style-config` — swap library or layout config, same
>   engine produces any product.
> - **ns = advanced frontend iteration**: `nishify.io`/`property`/`nishified`
>   are older frontends (real API calls); `ns` is the next-gen engine — fully
>   mock-first (`config.json` `mock: true` per endpoint+method → file mocks
>   mirroring real response shapes). The contract freezes in mocks first; the
>   nishify backend implements it. Flip `VITE_API_URL` + flags → same calls go
>   live. Backend-up not required for frontend work.
> - **Entity designer UI ("studio") = a DB design tool where the design IS the
>   running system** — like dbdiagram/Workbench but the diagram generates a
>   live API + admin + search index + migrations, not just documentation.
>   Meta-circular extension:
>   `/api/studio` already dumps `{client, order, entities}`; a designer UI =
>   forms over the DSL shape (fields/`validate`, `foreign_key`, M2M
>   `connection`, `kind`/`ref`/`ui`) + an `elastic_entities` editor (what
>   fields index where, `follow_fk`, `searchable_fields`, `weights`,
>   `exclude_if`) + ERD graph view (`eralchemy` already in requirements;
>   `clients/*/erd_*.txt|png` exist). Write path: save DSL → rerun
>   `code_generator` → models/tests/mocks regenerate → alembic migrate →
>   live API. Friction: `entities.py` is Python (lambdas like `exclude_if`,
>   `datetime` imports) — UI-driven editing needs a pure-JSON DSL or codegen
>   as the writer, and serializable function templates.
> - **Offline sync mechanics** (pt 5): offline = local sources serve; sync =
>   source→source reconciliation (same mechanism as Postgres→ES indexer).
>   `last_updated_at` is the core primitive — delta sync = server returns only
>   `updated_at > last_sync` rows; conflicts resolve by timestamp (last-write-
>   wins) or field-level merge; deletes need `deleted_at` tombstones or they
>   vanish silently. `updated_at`/`version` should be implicit on every entity
>   (like `id`), part of the options schema — not per-entity manual.
> - **Implicit audit logging** — same write-through side-effect family as the
>   indexer and accounting poster: every entity write → audit event (who via
>   `{{user_id}}`, before/after diff, when, which entity), zero handler code.
>   Already modeled: `pioneer` has `audit__audit_log_event` +
>   `audit__audit_trail` — audit config and records are both entities. Pays
>   off in debugging ("who changed what when"), compliance, and it doubles as
>   a change-feed for sync. Config: per-entity `audit: true`, sensitive-field
>   exclusions, retention — all DSL. Bonus: audit entities get free OPTIONS-
>   derived admin screens ("activity" tab).
> - **Accounting as the implicit base layer** (extends pt 7): for commerce
>   products, accounting is the foundation — every business event (order,
>   payment, refund, inventory move, purchase) is ultimately a ledger entry.
>   Already modeled in repo: `pioneer` client has `accounting__account`,
>   `accounting__journal_entry`, `accounting__ledger`,
>   `accounting__reconciliation` + `finance__*` entities. Implicit +
>   configurable = same write-through pattern as `AppIndexer`: entity write →
>   config-declared debit/credit mapping → auto-posted journal entry. Indexer
>   is the first derived side-effect; accounting poster would be the second —
>   the ledger becomes the system's memory from which reports/tax/
>   reconciliation derive.
> - **Indexing = source→source sync**: `AppIndexer` is literally one
>   source writing into another — Postgres write → refetch row →
>   `serialize_row` → ES doc with `refresh="wait_for"` (real-time
>   visibility). `elastic_entities` config controls the shape per entity:
>   `follow_fk` denormalizes 1:N/M:N relations into the doc, `flatten`,
>   `exclude_if` filters which rows index, `searchable_fields`/`weights`/
>   `analyzers` tune the query side. `EntityConfig.read_mode` (`sql`/`es`/
>   `hybrid`) is the per-entity routing config — sessions, caching, and
>   indexing all become source-level configuration, not application code.

## The Big Idea

```
clients/<client>/entities.py          ← THE source of truth (data, not code)
        │
        ├─ infra/code_generator.py ──► backend/clients/<client>/models/_gen.py  (ORM)
        │                            backend/clients/<client>/hooks.py          (defaults)
        │                            backend/clients/<client>/validators.py     (custom validators)
        │                            backend/tests/<client>/*.py                (generated tests)
        │                            nishify.io/.../mock/{entity}.ts            (frontend OPTIONS mocks)
        │                            excel/{entity}_sample.csv
        │
        ├─ backend/routers/entity_router.py ──► generated REST API at /api/{entity}/
        │
        └─ clients/<client>/elastic_entities.py ──► ES index/write-through config
```

At boot: `CLIENT_NAME` env picks the tenant package → `generate_entity_router()`
builds the entity map → `PostgresSource` + `ElasticSearchSource` + `AppIndexer`
are wired into a `SourceRouter` → one router serves every entity.

## Repo Layout

```
nishify/
├── backend/
│   ├── main.py                  # app entry: routers + /api/studio + /api/entities
│   ├── routers/
│   │   ├── entity_router.py     # THE generated CRUD+search router (core file)
│   │   ├── file_entity_router.py# /api/doc + /doc upload/serve/delete (DOC_ROOT=uploads/)
│   │   ├── inventory_filter.py  # hardcoded /api/inventory_filter filter schema
│   │   ├── studio.py            # _load_entities_blob → /api/studio metadata dump
│   │   └── clients/property/    # per-client custom routers (gemini_estimator…)
│   ├── clients/<client>/        # GENERATED per-tenant code (see pipeline below)
│   │   ├── models/_gen.py + <entity>.py stubs
│   │   ├── hooks.py             # ENTITY_DEFAULTS + FILE_FIELDS (generated, unused at runtime)
│   │   ├── validators.py        # REGISTRY["entity.field"] = fn (generated)
│   │   ├── custom_serializers.py# CONFIG = m2m wiring (see below)
│   │   └── elastic_entities.py  # copied from clients/<client>/
│   ├── search_elastic/
│   │   ├── es_client.py         # unified client: BONSAI_URL→OpenSearch, else ES_URL→ES9
│   │   └── indexer.py           # serialize_row, resolve_index_name, ensure_index…
│   ├── utils/                   # config.py (CLIENT_NAME), db.py (engine/SessionLocal),
│   │                            # model_loader.py (entity→ORM class), pydantic_model.py,
│   │                            # clean_fields.py (de-stringify JSON fields)
│   ├── alembic/ + alembic.ini   # schema migrations (one initial_schema revision)
│   ├── tests/<client>/          # generated conftest + test_crud + test_filters
│   └── scripts/                 # load_sample_data, seed_data_from_entities_data, show_counts
├── sources/                     # FRAMEWORK-INDEPENDENT source layer (pluggable backends)
│   ├── base.py                  # Protocols: Source, FileSource, S3Source, FtpSource
│   │                            #   + Query/Filter/Sort/ResultPage contracts
│   ├── source_router.py         # SourceRouter: hybrid read routing + write-through indexing
│   ├── rdbms/source.py          # PostgresSource (filters, sort, m2m augment/write, upsert)
│   ├── search/elastic_source.py # ElasticSearchSource (read-only; bool/multi_match queries)
│   ├── search/federated.py      # FederatedSearchSource (fan-out + merge w/ provenance)
│   ├── search/indexer.py        # WriteThroughIndexer hook base class
│   ├── json/source.py           # JsonSource (file-backed source impl)
│   ├── file_source.py           # local file storage source
│   └── tests/                   # source-layer unit tests
├── clients/                     # ROOT-level entity DSL packages (on sys.path!)
│   ├── pioneer_fresh/entities.py     # wholesale inventory ERP, ~30 entities
│   ├── pioneer/entities.py           # marketplace/accounting variant (domain__entity models)
│   ├── pioneer_wholesale_inc/        # entities + elastic_entities
│   ├── property/entities.py          # real-estate client
│   ├── demo/entities.py              # demo tenant (+ elastic_entities, test_crud_data)
│   └── jnq/business_logic_test_cases/# scratch sqlite test models
├── infra/
│   ├── code_generator.py        # DSL→code pipeline (Jinja2 .py.j2 templates)
│   ├── templates/               # models/hooks/tests/conftest j2 templates
│   └── test_crud.py, test_search.py  # smoke scripts
├── nish_auth/                   # Keycloak-on-Heroku (Dockerfile, heroku.yml, Procfile, realm docs)
├── keycloak-heroku-master/      # older Keycloak checkout
├── nishify.io/                  # Next.js frontend (NEXT_PUBLIC_CLIENT_NAME, USE_MOCK; packages/nishdoc)
├── nishify.ai/                  # Next.js "dreamspos" app
├── nishified/                   # ANOTHER full-stack variant: backend + clients + Next frontend + web/mocks
├── property/                    # Vite+React property frontend
├── nisource/                    # DDD multi-client variant + schema_generator (models from schema)
│                                #   + ddd_multi_client_full/docker-compose.yml (postgres app/app/appdb)
├── mdm/                         # Django master-data-management project + scrapper/
├── iterator-module/             # standalone copy of the iterator component (same as ns iterator)
├── nishify_website/             # static marketing site (Dockerfile + Procfile, ~10M of html)
├── git_local_setup/             # docker-compose helper + setup screenshots
├── branding/, docs/, clients/*/erd_*.txt|png  # ERDs + brand assets
├── reset.sh / reset.bat         # 12-step tenant seed: venv→pip→DB→alembic→ES wipe→sample data
├── docker-compose.yaml          # ONLY elasticsearch:9.1.0 (:9200/:9300)
├── Procfile                     # `web: gunicorn mdm.wsgi --chdir mdm` (Heroku → mdm Django app!)
└── requirements.txt             # ONE shared env: fastapi, django, elasticsearch, boto3, cloudinary…
```

## Request Lifecycle (API call path)

`GET /api/item/?q=rice&page=2&sort=-name&brand_id=5&price__gte=10`

1. `generate_entity_router`'s `list_items` → `_build_squery(request)` parses
   `page/size/q/sort` + arbitrary `field__op` filters (ops: `eq in contains
   startswith endswith gt gte lt lte isnull notnull`; `in` is comma-split).
2. `SourceRouter.list` picks a source: `hybrid` mode → ES if `q` present AND
   entity `indexed` AND ES configured; else Postgres. `?source=es|sql` forces it.
3. `PostgresSource.list` → SQLAlchemy `select(model)` + `_apply_filters`
   (type-coerces values to column types: int/float/date/bool/datetime) +
   case-insensitive `contains` + `q` OR-ed across all string columns +
   offset/limit → rows → `_to_dict` (columns + relationships) →
   `_augment_m2m` (join-table lookups for configured m2m fields).
4. `ElasticSearchSource.list` → `bool.must` term filters + `multi_match` on
   `searchable_fields` + from/size + `track_total_hits`.
5. Router returns `{items, page, size, total, _provenance?}` and sets the
   `X-Data-Source: sql|es|es-federated` header. `clean_items_list()` repairs
   stringified-JSON fields before returning.
6. **Writes**: `srouter.create/update/delete` → primary (Postgres) →
   `AppIndexer` write-through: refetch row → `serialize_row` → `ensure_index`
   → `es.index(refresh="wait_for")`. ES8 `document=` kwarg with OpenSearch
   `body=` fallback shim (`_es_index`).

## REST Surface (generated per entity)

| Route | Notes |
|---|---|
| `GET /api/{entity}/` | list; filters/sort/pagination/q; `X-Data-Source` header |
| `GET /api/{entity}/{id}/` | get one |
| `POST /api/{entity}/` | JSON **or multipart** (`data` field = JSON + UploadFiles → stored paths; `image_gallery`→JSON string) |
| `PUT /api/{entity}/{id}/` | JSON-only update, validated by generated Pydantic model |
| `DELETE /api/{entity}/{id}` **and** `/{id}/` | both registered (redirect_slashes=False) |
| `GET /api/{entity}/options/?schema=basic\|full` | entity schema — **this IS the admin screen** for the `ns` frontend |
| `GET /api/_search/?q=&entities=a,b\|scope=name&size_per_entity=` | federated ES across indexed entities |
| `GET /api/studio` | `{client, order, entities}` DSL dump + ETag |
| `GET /api/entities` | entity key list (hardcoded to pioneer_fresh — bug) |
| `POST /api/doc/` + `GET/DELETE /doc/{client}/{path}` | file upload/serve/delete under `uploads/` |
| `GET /api/inventory_filter/` | hardcoded filter-schema JSON |
| `GET /` , `/healthz` | health |

## The Entity DSL (`clients/<client>/entities.py`)

Single source of truth per tenant. Two blocks:

```python
ENTITIES_ORDER = ["weights", "colors", ..., "item", "purchase_order", ...]

entities = {
  "item": {
    "fields": {
      "id":        {"type": "int", "primary_key": True},
      "name":      {"type": "str", "required": True,
                    "validate": {"regex": r"...", "message": "..."}},
      "vendor_id": {"type": "int", "foreign_key": "vendor.id",
                    "relation_type": "many-to-one"},
      "item_category_ids": {
        "type": "many-to-many",
        "connection": {"table": "item_category_map",
                       "fk": "item_category_id", "self_key": "item_id",
                       "fields": ["id", "name"]},
      },
    },
    "sample_data": [...],          # seeded by reset.sh / seed scripts
    # + UI/options blocks: {"name","kind":string|bool|fk|radio,...,"ref":{"entity","valueKey","labelKey"},"ui":{"label","input"}}
  },
}
```

Field types: `int str float bool date datetime file` + `foreign_key` /
`many-to-many` / polymorphic refs. The `kind`/`ref`/`ui` blocks drive the
`/options/` response → which drives the `ns` frontend's admin screens and
forms. **One DSL entry = table + API + OPTIONS schema + admin UI + mock.**

## Source Layer (`sources/`) — pluggable backends

`Source` protocol (base.py): `list/get/create/update/delete/options`.
`Query` = `{filters[], sorts[], page, size, q}` → `ResultPage` =
`{items, page, size, total, provenance}`.

| Impl | Role |
|---|---|
| `PostgresSource` | primary. Filter ops + value coercion, `q` across string cols, `_to_dict` walks ORM relationships, m2m augment on read + replace-semantics write, idempotent create (PK-present payload → upsert) |
| `ElasticSearchSource` | read/search only. `index_map` entity→index, `searchable_fields` for multi_match |
| `FederatedSearchSource` | `list_multi` fan-out across entities, merges items with per-item `_entity` provenance |
| `WriteThroughIndexer` | hook base → `AppIndexer` in entity_router |
| `JsonSource`, `file_source` | alt file-backed impls (not wired into the app) |
| `FileSource / S3Source / FtpSource` | protocols only — defined, unimplemented |

Read modes per entity (`EntityConfig.read_mode`): `sql | es | json | hybrid`
(default hybrid — ES only when `q` + indexed).

## Elasticsearch Config (`clients/<client>/elastic_entities.py`)

Per-entity index definition — the richest config in the repo:

```python
elastic_entities = {
  "item": {
    "index_name": "item_index",          # actual index = <client>_<index_name>
    "__all__": True,                      # or explicit "fields": [...]
    "follow_fk": {                        # denormalize related rows into doc
      "vendor": {"__all__": True,
                 "follow_fk": {"state": {"fields": ["id","name","code"]}}},
      "category": {...}, ...
    },
    "flatten": True,
    "searchable_fields": ["name","description","item_code","vendor.name",...],
    "weights":  {"name": 2.0, "item_code": 1.5},      # boost fields
    "suggest_fields": [...], "field_aliases": {"vendor.name":"vendorName"},
    "analyzers": {"name": "edge_ngram_analyzer"},
    "exclude_if": lambda d: d.get("active") is False,  # skip inactive docs
    "nested_fields": ["vendor","tax_group"],
    "meta": {"refresh_interval": "1s", "number_of_shards": 1},
  },
}
# module ALSO exports INDEX_MAP, SEARCHABLE_FIELDS, COLLECTIONS (named scopes for /_search/)
```

`es_client.py` picks the driver: `BONSAI_URL` → `opensearchpy.OpenSearch`
(Bonsai on Heroku), else `ES_URL` (default `http://localhost:9200`) →
`elasticsearch.Elasticsearch` (optional `ES_API_KEY` / `ES_USER`+`ES_PASS`).
`docker-compose.yaml` runs local ES 9.1.0.

## Code Generation Pipeline (`infra/code_generator.py`)

`python infra/code_generator.py <CLIENT>` (or `CLIENT_NAME` env). Reads
`clients/<client>/entities.py`, renders Jinja2 templates in
`infra/templates/`:

- `backend/clients/<c>/models/_gen.py` + one stub per entity
  (`from ._gen import X`) — pioneer uses `domain__entity` module names
- `hooks.py` (ENTITY_DEFAULTS, FILE_FIELDS), `validators.py` (REGISTRY)
- `backend/tests/<c>/` conftest + crud + filters tests
- `nishify.io/.../mock/{entity}.ts` OPTIONS mocks for the frontend
- `excel/{entity}_sample.csv` from `sample_data`
- copies `elastic_entities.py` into `backend/clients/<c>/`
- emits `frontend.admin.config.json`, ensures `site-config.json`, `home.json`

## Multi-Tenancy

- `CLIENT_NAME` env → `clients.<client>.entities` + `backend.clients.<client>.models`
- `DATABASE_URL` → that tenant's Postgres DB (**DB-per-tenant**). Default in
  `db.py`: `postgresql://postgres:deepti@localhost:5432/pioneer_fresh`
  (hardcoded password — local dev only).
- ES index prefix: `<client>_` (wiped and rebuilt by reset.sh).
- `reset.sh` (12 steps): venv+pip → PG env (`PGHOST/PORT/USER/PASS/DB_NAME`) →
  delete `<client>_*` ES indices → create DB → alembic → run code_generator →
  seed `sample_data` → reindex. Usage:
  `DB_NAME=demo_db CLIENT_NAME=demo ./reset.sh`
- `redirect_slashes=False` — register both slash forms (done for DELETE).

## Auth (`nish_auth/`)

Keycloak deployed to Heroku via Docker (`Dockerfile`, `heroku.yml`, `Procfile`,
`docker-entrypoint.sh`, `themes/`). README documents the live realm `prop` +
OIDC client `property-react-app` + password-grant token endpoint.
Deploy: `git subtree split --prefix nish_auth` → push to heroku-auth remote.
`keycloak-heroku-master/` = older checkout. Backend itself does **no** auth
checks — auth lives at the frontend/Keycloak layer.

## How It Fits Together (`ns` ↔ `nishify`)

`ns` is **inspired by nishify** — the frontend engine copies the platform's
core ideas into React land: entity-driven screens (page = JSON definition,
not hand-written), OPTIONS-response = the admin screen, mock-first
`config.json` routing mirroring API response shapes, per-client tenancy
(`vite-client` ↔ `CLIENT_NAME`).

The `ns` frontend's `apiClient` calls `VITE_API_URL/api/...` — these exact
endpoints. `GET /api/{entity}/` → list pages, `OPTIONS` → admin CRUD screens,
`/_search/` → federated search. In dev, `ns` runs on file mocks with the same
response shapes (`config.json` decides mock vs live per endpoint+method).

## Commands

```bash
# backend (CLIENT_NAME + DATABASE_URL required for real tenant)
export CLIENT_NAME=pioneer_fresh
export DATABASE_URL=postgresql://app:app@localhost:5432/pioneer_fresh
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload   # /docs for Swagger

# postgres (app/app/appdb :5432)
cd nisource/ddd_multi_client_full && docker-compose up

# elasticsearch 9.1.0 (:9200)
docker compose up

# or Bonsai/OpenSearch
export BONSAI_URL='https://user:pass@host.bonsaisearch.net'

# full tenant reset+seed (needs postgres running)
DB_NAME=pioneer_fresh CLIENT_NAME=pioneer_fresh ./reset.sh

# regenerate client code from DSL
python infra/code_generator.py pioneer_fresh

# tests (generated per-client)
pytest backend/tests/pioneer_fresh -k crud
python infra/test_crud.py   # smoke
```

## Gotchas

- **`clients/` vs `backend/clients/` are TWO different packages**: root
  `clients/` holds the DSL (`entities.py`, `elastic_entities.py`) and is on
  `sys.path`; `backend/clients/` holds generated code. `import clients.<c>.entities`
  must resolve or every entity endpoint 404s.
- **`/api/entities` is hardcoded** to `pioneer_fresh` regardless of `CLIENT_NAME`.
- **`hooks.py` is generated but dead** — nothing imports it at runtime, and the
  generated file contains JS-style `true`/`false` literals (would `NameError`
  if ever imported).
- **CORS is `allow_origins=["*"]` + `allow_credentials=True`** — invalid per
  spec (browsers ignore credentials with `*`); wide open for dev either way.
- **One `requirements.txt` for everything** — fastapi + django + elasticsearch +
  boto3 + cloudinary + Faker all in one env.
- **Create is an upsert**: `PostgresSource.create` updates in place when the
  payload contains the PK of an existing row.
- **`custom_serializers.CONFIG` is loaded in two places** (entity_router import
  time AND `rdbms/source.py` import time) — both keyed off `CLIENT_NAME`.
- **Procfile runs the Django `mdm` app**, not the FastAPI service — Heroku
  deploys are per-subtree (nish_auth, nishify_website, mdm), not the monorepo.
- **Multipart POST**: only `image_gallery`-type fields are JSON-stringified;
  other list fields stay lists (may fail on TEXT columns).
- Repo carries generated/binary artifacts: `backend.zip`, `doc_upload.zip`,
  `dumpfile.dump`, `item_dump.sql`, `db.sqlite3`, `pioneer_backup_*.json`,
  `*.png` ERDs, `structure.txt`.
- `syskill/` and `nishify/` (self-gitlink) are **empty dead dirs**.
- `sources/` (root) is the live layer; `nisource/sources/` is the older DDD
  copy it was extracted from — don't confuse them.
- `property` client create has a dead `and False` special-case hook for
  `property_image_uploaded` in `create_item`.
- `sources/json/` + `file_source.py` + S3/FTP protocols exist but are **not
  wired** into `generate_entity_router` — primary is always Postgres.

## Tests

`backend/tests/<client>/` — generated `conftest.py` + `test_crud.py` +
`test_filters.py` per tenant (pioneer_fresh, pioneer, pioneer_wholesale_inc,
demo, property). `sources/tests/` — source-layer unit tests.
`infra/test_crud.py`, `infra/test_search.py` — API smoke scripts.
`clients/jnq/business_logic_test_cases/` — scratch sqlite model tests.

## Related Docs

- `../ns/docs` → `ns.md` (frontend engine, the API consumer)
- `AGENTS.md` (repo root — condensed version of this file)
- `README_DEEPTI.md`, `README_NISOURCE.md`, `docs/README_Heroku_notes.md`,
  `docs/README.HEROKU_DEPLOYED.md`
- `nisource/README.md`, `clients/pioneer*/README.md`
- `notes.txt` in the `ns` repo — provenance of the 4 merged source repos
