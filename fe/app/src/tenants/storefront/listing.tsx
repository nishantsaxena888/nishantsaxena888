import { Star } from "lucide-react";
import { useEntity } from "@/engine";
import { useConfigStore } from "@/store/use-config-store";
import { useLanguage } from "@/components/shared/language-provider";
import { toast } from "@/lib/toast";
import { listOf, money, makeTr } from "./utils";

// Generic card-grid listing. Items come from the def's dynamic action
// (actionData.data.data). The card action posts the item to a named
// session — properties.session / content.session (default "cart") —
// when that session is configured; otherwise it's a no-op with a toast,
// so the comp stays usable for any entity list on any client.
export const StorefrontListing = ({ content, properties, actionData }: any) => {
  const tr = makeTr(useLanguage().t);
  const products = listOf(actionData?.data?.data);
  const session = content?.session || properties?.session || "cart";
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const hasCart = useConfigStore((s: any) =>
    (s.config?.sessions || []).some((x: any) => x.name === session),
  );
  const cart = useEntity(session);

  const addToCart = async (p: any) => {
    if (!hasCart) {
      toast.info(`Session "${session}" is not configured for this client`);
      return;
    }
    await cart.onPost(p);
    toast.success(tr("listing.added", `${p.name} added`));
  };

  if (actionData?.loading) return <div className="sf-list-loading">Loading…</div>;

  return (
    <section className="sf-list">
      {content?.title && <h2>{content.title}</h2>}
      <div className="sf-list-grid">
        {products.map((p: any) => (
          <article key={p.id ?? p.sku ?? p.name} className="sf-list-card">
            {p.badge && <span className="sf-list-badge">{p.badge}</span>}
            {p.image && (
              <img src={p.image} alt={p.name} loading="lazy" />
            )}
            <div className="sf-list-body">
              <h3>{p.name}</h3>
              {p.rating && (
                <span className="sf-rating">
                  <Star className="h-3.5 w-3.5" /> {p.rating}
                  {p.reviews ? ` (${p.reviews})` : ""}
                </span>
              )}
              {p.description && <p>{p.description}</p>}
              <div className="sf-price-row">
                <strong>{money(p.price, currency)}</strong>
                {p.originalPrice && p.originalPrice > p.price && (
                  <s>{money(p.originalPrice, currency)}</s>
                )}
              </div>
              <button
                className="sf-action-btn"
                disabled={p.stock === 0}
                onClick={() => addToCart(p)}
              >
                {p.stock === 0
                  ? tr("listing.out_of_stock", "Out of stock")
                  : tr("listing.add_to_cart", "Add to cart")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!actionData?.loading && products.length === 0 && (
        <p className="sf-empty">{tr("listing.empty", "No items found.")}</p>
      )}
    </section>
  );
};
