import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useEntity } from "@/engine";
import { useGenericState } from "@/store/use-generic-state";
import { useConfigStore } from "@/store/use-config-store";
import { useLanguage } from "@/components/shared/language-provider";
import { money, makeTr } from "./utils";

// Generic cart page backed by the client's "cart" session
// (useGenericState persists it). Reads items live — matches the header
// badge — and mutates through useEntity session ops.
export const StorefrontCartView = ({ content }: any) => {
  const tr = makeTr(useLanguage().t);
  const cartData = useGenericState((s: any) => s.data?.cart);
  const items = Array.isArray(cartData) ? cartData : [];
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const cart = useEntity("cart");

  const setQty = (item: any, qty: number) => {
    if (qty <= 0) return cart.onDelete(item.id);
    cart.onUpdate(item.id, { ...item, qty });
  };

  const total = Array.isArray(items)
    ? items.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1), 0)
    : 0;

  if (!items.length) {
    return (
      <section className="sf-cart-empty">
        <h1>{content?.title || tr("cart.title", "Your cart")}</h1>
        <p>{tr("cart.empty", "Your cart is empty.")}</p>
        <Link to="/shop" className="sf-cta">
          {tr("cart.continue_shopping", "Continue shopping")}
        </Link>
      </section>
    );
  }

  return (
    <section className="sf-cart">
      <h1>{content?.title || tr("cart.title", "Your cart")}</h1>
      <div className="sf-cart-layout">
        <ul className="sf-cart-items">
          {items.map((i: any) => (
            <li key={i.id} className="sf-cart-item">
              {i.image && <img src={i.image} alt={i.name} />}
              <div className="sf-cart-item-info">
                <strong>{i.name}</strong>
                <span>{money(i.price, currency)}</span>
              </div>
              <div className="sf-qty">
                <button onClick={() => setQty(i, (i.qty ?? 1) - 1)}>−</button>
                <span>{i.qty ?? 1}</span>
                <button onClick={() => setQty(i, (i.qty ?? 1) + 1)}>+</button>
              </div>
              <strong className="sf-line-total">
                {money((i.price ?? 0) * (i.qty ?? 1), currency)}
              </strong>
              <button
                className="sf-remove"
                aria-label={tr("cart.remove", "Remove")}
                onClick={() => cart.onDelete(i.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <aside className="sf-cart-summary">
          <h3>{tr("checkout.order_summary", "Order summary")}</h3>
          <div className="sf-summary-row">
            <span>{tr("cart.subtotal", "Subtotal")}</span>
            <strong>{money(total, currency)}</strong>
          </div>
          <div className="sf-summary-row">
            <span>{tr("cart.shipping", "Shipping")}</span>
            <strong>{total > 30 ? "Free" : money(4.99, currency)}</strong>
          </div>
          <div className="sf-summary-total">
            <span>{tr("cart.total", "Total")}</span>
            <strong>
              {money(total + (total > 30 ? 0 : 4.99), currency)}
            </strong>
          </div>
          <Link to="/checkout" className="sf-cta sf-checkout-btn">
            Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
};
