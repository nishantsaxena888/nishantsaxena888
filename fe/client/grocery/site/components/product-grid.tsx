// grocery client — product grid. Rendered by RenderEngine with
// properties.type = "dynamic"; actionData.data.products holds the
// GET /api/product response ({items, page, size, total}).

const CATEGORY_HUES: Record<string, string> = {
  Produce: "bg-green-500/15 text-green-700",
  Dairy: "bg-sky-500/15 text-sky-700",
  Bakery: "bg-amber-500/15 text-amber-700",
  Drinks: "bg-violet-500/15 text-violet-700",
};

export const ProductGrid = ({ content, actionData }: any) => {
  const items = actionData?.data?.products?.items || [];
  const loading = actionData?.loading;

  return (
    <div className="m-4">
      {content?.title && (
        <h2 className="mb-3 text-xl font-semibold text-foreground">{content.title}</h2>
      )}
      {loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      )}
      <div className="entity-grid-container">
        {items.map((p: any) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50"
          >
            <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-muted text-2xl font-bold text-muted-foreground">
              {String(p.name || "?").charAt(0)}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <span
                  className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    CATEGORY_HUES[p.category] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.category}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  ${Number(p.price || 0).toFixed(2)}
                </p>
                {p.on_sale && (
                  <p className="text-[11px] font-medium text-destructive">SALE</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
