import React from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "@/engine";
import { useGenericState } from "@/store/use-generic-state";
import { useConfigStore } from "@/store/use-config-store";
import { toast } from "@/lib/toast";
import { money } from "./utils";

// Generic checkout — contact/address form + order summary from the cart
// session. On submit it POSTs to the configured order entity (default
// "order") and clears the cart. Field labels come from content so a
// client can restyle without touching the comp.
export const StorefrontCheckout = ({ content }: any) => {
  const navigate = useNavigate();
  const cartData = useGenericState((s: any) => s.data?.cart);
  const items = Array.isArray(cartData) ? cartData : [];
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const orderEntity = content?.order_entity || "order";
  const orders = useEntity(orderEntity);
  const cart = useEntity("cart");
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [placing, setPlacing] = React.useState(false);

  const total = items.reduce(
    (s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1),
    0,
  );

  const set = (k: string) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      toast.info("Your cart is empty");
      return;
    }
    setPlacing(true);
    const res = await orders.onPost({
      ...form,
      items,
      total,
      status: "placed",
      created_at: new Date().toISOString(),
    });
    setPlacing(false);
    if (res?.error) {
      toast.error("Could not place the order");
      return;
    }
    for (const i of items) await cart.onDelete(i.id);
    toast.success("Order placed — thank you!");
    navigate(content?.success_url || "/");
  };

  const field = (key: string, label: string, extra: any = {}) => (
    <label className="sf-field" key={key}>
      <span>{label}</span>
      <input required onChange={set(key)} {...extra} />
    </label>
  );

  return (
    <section className="sf-checkout">
      <h1>{content?.title || "Checkout"}</h1>
      <div className="sf-cart-layout">
        <form className="sf-checkout-form" onSubmit={placeOrder}>
          <h3>Contact</h3>
          {field("name", "Full name")}
          {field("email", "Email", { type: "email" })}
          {field("phone", "Phone", { type: "tel" })}
          <h3>Delivery</h3>
          {field("address", "Address")}
          {field("city", "City")}
          {field("zip", "ZIP / PIN")}
          <button className="sf-cta" disabled={placing}>
            {placing ? "Placing…" : `Place order · ${money(total, currency)}`}
          </button>
        </form>
        <aside className="sf-cart-summary">
          <h3>{items.length} item(s)</h3>
          {items.map((i: any) => (
            <div key={i.id} className="sf-summary-row">
              <span>
                {i.name} × {i.qty ?? 1}
              </span>
              <strong>{money((i.price ?? 0) * (i.qty ?? 1), currency)}</strong>
            </div>
          ))}
          <div className="sf-summary-total">
            <span>Total</span>
            <strong>{money(total, currency)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
};
