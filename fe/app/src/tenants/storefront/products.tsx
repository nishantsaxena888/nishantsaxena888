import { Star } from "lucide-react";
import { useEntity } from "@/engine";
import { useConfigStore } from "@/store/use-config-store";
import { toast } from "@/lib/toast";
import { listOf, money } from "./utils";

// Generic storefront product grid. Items come from the def's dynamic
// action (actionData.data.data). "Add to cart" posts to the client's
// configured cart session when one exists — otherwise it's a no-op with
// a toast, so the comp stays usable for non-commerce clients.
export const StorefrontProducts = ({ content, actionData }: any) => {
  const products = listOf(actionData?.data?.data);
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const hasCart = useConfigStore((s: any) =>
    (s.config?.sessions || []).some((x: any) => x.name === "cart"),
  );
  const cart = useEntity("cart");

  const addToCart = async (p: any) => {
    if (!hasCart) {
      toast.info("Cart is not configured for this client");
      return;
    }
    await cart.onPost(p);
    toast.success(`${p.name} added to cart`);
  };

  if (actionData?.loading) return <div className="sf-grid-loading">Loading…</div>;

  return (
    <section className="sf-products">
      {content?.title && <h2>{content.title}</h2>}
      <div className="sf-product-grid">
        {products.map((p: any) => (
          <article key={p.id ?? p.sku ?? p.name} className="sf-product-card">
            {p.badge && <span className="sf-product-badge">{p.badge}</span>}
            {p.image && (
              <img src={p.image} alt={p.name} loading="lazy" />
            )}
            <div className="sf-product-body">
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
                className="sf-add-btn"
                disabled={p.stock === 0}
                onClick={() => addToCart(p)}
              >
                {p.stock === 0 ? "Out of stock" : "Add to cart"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!actionData?.loading && products.length === 0 && (
        <p className="sf-empty">No products found.</p>
      )}
    </section>
  );
};
