# todo_2_ecomm — Generic E-commerce Platform Build Plan

> **ecomm** = a generic e-commerce platform built on the shared model:
> `nishify` backend (entities → API + admin + search) + `ns` frontend engine
> (JSON-driven storefront) + markdown content pattern from `uday_aws`.
> Not one shop — the **platform**; grocery/fashion/liquor/Airbnb-style
> products are tenants/configs of it (pt 7, 9). Traces back to "Nishant's
> Model" in `nishify.md`, `ns.md`, `uday_aws.md`.

## Vision (one line)

Design commerce entities → get storefront + admin + search + accounting for
free; each brand is a tenant config + component library build.

---

## 1. Backend — `nishify` (pts 1–4, 6)

- [ ] Create `clients/ecomm/entities.py` — DSL draft. Reuse patterns from
  `pioneer_fresh`/`pioneer` (already wholesale-inventory ERP):
  - Catalog: `item`, `item_category`, `category_map`, `brand`, `tag`,
    `item_image`, `item_pricing`, `price_group`, `tax_group`
  - Party: `customer`, `vendor`, `address`, `state`, `salesperson`
  - Order flow: `cart`/`session_cart`, `order`, `order_item`,
    `payment`, `shipment`, `return`, `coupon`/`promotion`
  - Inventory: `warehouse`, `inventory`, `inventory_ledger`,
    `goods_receipt`, `purchase_order`
  - RBAC (pt 3): `user`, `group`, `group_permission_map`,
    `user_role_map` (customer / staff / admin / vendor groups)
  - **Accounting base** (implicit): `account`, `journal_entry`, `ledger`,
    `reconciliation`, `invoice`, `settlement`, `tax` — port the
    `accounting__*`/`finance__*` domain from `pioneer`
- [ ] Relations: `order_item → order` (fk), `item_category_map` (M2M),
  `customer → address` (1:N), `payment → order`, `inventory → item+warehouse`
- [ ] `elastic_entities.py` — index `item`, `category`, `brand`
  (`follow_fk` vendor/category, searchable_fields name/description/UPC,
  `exclude_if` inactive, weights on name) — catalog search
- [ ] `infra/code_generator.py ecomm` → models/hooks/tests/mocks
- [ ] `DB_NAME=ecomm_db CLIENT_NAME=ecomm ./reset.sh` → migrate + seed
- [ ] **Accounting poster** (write-through sink #2): order/payment/refund
  → config debit/credit mapping → auto journal entries
- [ ] **Audit logging** (write-through sink #3) on money + order entities
- [ ] `last_updated_at`/`version` implicit (sync contract)

## 2. Auth + RBAC (pt 3)

- [ ] Keycloak realm + OIDC client for storefront + admin
- [ ] SSO → internal `user`/`group` mapping (email vs `sub`)
- [ ] Groups: customer (own orders/cart only — row-level `{{user_id}}`),
  staff (order ops, limited columns), vendor (own items/POs only),
  admin (all)
- [ ] Column-level: cost/margin/vendor fields hidden from customer group —
  OPTIONS + payload filtered server-side
- [ ] Admin menu/route perms via group config

## 3. Storefront — `ns` (pts 1–6)

- [ ] `ecomm` tenant(s) in `src/tenants` componentsMap — brand variants
  (grocery/fashion/liquor already exist as tenants → migrate to one ecomm
  engine, brand = config)
- [ ] `src/mock/ecomm/<lang>/<endpoint>/...` mock tree — contract first
- [ ] Page definitions: home, PLP (list + filters + ES `q` search), PDP,
  cart drawer, checkout flow, profile/orders, order tracking
- [ ] **Sessions as local sources**: `cart`, `wishlist`, `recently_viewed`,
  `address_book` — `sessions[]` config, `array_upsert` etc. — cart works
  offline, syncs on login (anonymous→user cart merge — open question)
- [ ] Custom flow modules kept thin: checkout, cart, profile (only these
  3 are non-generic per the plan.md rule)
- [ ] Product/guides/blog content via markdown reader (uday pattern)
- [ ] Themes: `style-config/<brand>` per brand; multi-theme + multilingual
- [ ] Admin: OPTIONS-derived screens for every entity (`default-admin`)

## 4. Offline + sync (pt 5)

- [ ] Catalog browsable offline (cached after view) — POS mode possible
- [ ] Cart/wishlist local-first, sync on connectivity + on login merge
- [ ] Delta sync `updated_at > last_sync`; tombstones for deletes
- [ ] Conflict policy: cart = server-merge by qty, orders = server-wins

## 5. Package + multi-tenant (pts 7–9)

- [ ] One `ns` codebase → per-brand builds: `config` + component lib dep
  in package.json (build-time multi-tenancy)
- [ ] Backend `CLIENT_NAME` per tenant DB — DB-per-tenant
- [ ] Fix `file:` dep path + `npm install` (broken symlink today)

## 6. Stretch / later

- [ ] Vendor marketplace (multi-vendor onboarding via entities)
- [ ] Studio designer for storefront layout (options-derived)
- [ ] AI source: recommendations, search ranking — undecided
- [ ] POS/desktop packaged app (Electron/Tauri)
- [ ] Real-time inventory sync (write-through event feed)

---

### Open decisions (discuss before building)

1. Start from `pioneer_fresh` entities (rename/extend) vs fresh `ecomm` DSL?
2. Cart: entity-backed (server cart) vs session-only + merge on login?
3. Checkout: custom flow module or fully OPTIONS-derived eventually?
4. Multi-vendor in v1 or single-seller?
5. Payments integration approach (gateway per tenant config?)
6. One `ecomm` tenant with brand themes vs separate tenant per brand?
