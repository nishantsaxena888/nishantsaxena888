# fe/client/<name> — client contract

A client is a **dumb folder**: components + css. No logic, no install, no
package.json — selection and wiring live in the generic `fe/app`.

## Layout

```
fe/client/<name>/
  site/                     ← S surface — route "/" renders these
    tenant.ts               ← export default { components: {...} }
    components/             ← .tsx (+ use-*.ts hooks if logic grows)
    styles.css              ← optional; import "./styles.css" in tenant.ts
  admin/                    ← A surface — route "/admin" renders these
    tenant.ts               ← export default { components: {...} }
    components/             ← usually empty: generic OPTIONS admin wins
```

## tenant.ts contract

```ts
export default {
  components: {
    "my-widget": MyWidget,   // def.type in a page def → this component
  },
};
```

Must satisfy `ClientTenant` (`fe/app/src/tenants/types.ts`). Components
receive `RenderComponentProps`: `{id, type, content, properties,
actionData, config, themeName}` — all `any`, all optional. Write them
engine-optional (`content?.title ?? fallback`) so they also render
standalone.

## Page definitions

Pages come from `be/client/<name>/configuration.json → pages`:

```json
{
  "id": "hero-1",
  "type": "my-widget",                       // → your component key
  "properties": { "level": "base", "type": "static" },
  "content": { "title": "Hi" }               // → props.content
}
```

Dynamic defs fetch on mount — `actionData.data.<key>` gets the API
response:

```json
"properties": {
  "type": "dynamic",
  "action": [
    { "key": "products", "endpoint": "product", "method": "GET",
      "queryParams": { "size": 8 } }
  ]
}
```

→ `actionData.data.products.items` (list endpoints return
`{items, page, size, total}`). `actionData.action({key, type, data})`
re-fires the call for filters/search.

## Menu → page wiring

`menu[]` items: `{name, url, entity, public, order, auth_page}`. A url
like `/shop` hits the `/:slug` route → `entity` is fetched via apiClient —
use `pages/<slug>` for config pages (served by `GET /api/pages/<slug>`).

## Rules

- Cross-client-useful → `fe/app` (generic). Only-this-client → here.
- Admin needs nothing: `admin/tenant.ts` exports `{ components: {} }` and
  the OPTIONS-driven `default-admin` + media manager cover CRUD screens.
  Add a client admin comp only for screens beyond the generic grid.
- CSS: prefer theme vars (`bg-primary`, `text-foreground`…) — values come
  from the client's `style-configs`. Bespoke css → `site/styles.css` +
  `import "./styles.css"` in `site/tenant.ts`.
