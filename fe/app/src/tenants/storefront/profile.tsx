import React from "react";
import { useEntity } from "@/engine";
import { useConfigStore } from "@/store/use-config-store";
import { toast } from "@/lib/toast";
import { listOf, money } from "./utils";

// Generic account page — profile form (saved to the configured user
// entity, default "user") + recent orders from the order entity when the
// def's action supplies it.
export const StorefrontProfile = ({ content, actionData }: any) => {
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const userEntity = content?.user_entity || "user";
  const user = useEntity(userEntity);
  const [form, setForm] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "{}");
    } catch {
      return {};
    }
  });
  const orders = listOf(actionData?.data?.orders);

  const set = (k: string) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("profile", JSON.stringify(form));
    const res = await user.onPost(form).catch(() => null);
    if (res?.error) toast.error("Could not save profile");
    else toast.success("Profile saved");
  };

  const field = (key: string, label: string, extra: any = {}) => (
    <label className="sf-field" key={key}>
      <span>{label}</span>
      <input value={form[key] || ""} onChange={set(key)} {...extra} />
    </label>
  );

  return (
    <section className="sf-profile">
      <h1>{content?.title || "My account"}</h1>
      <div className="sf-cart-layout">
        <form className="sf-checkout-form" onSubmit={save}>
          <h3>Profile</h3>
          {field("name", "Full name")}
          {field("email", "Email", { type: "email" })}
          {field("phone", "Phone", { type: "tel" })}
          {field("address", "Default address")}
          <button className="sf-cta">Save</button>
        </form>
        <aside className="sf-cart-summary">
          <h3>Recent orders</h3>
          {orders.length === 0 && <p>No orders yet.</p>}
          {orders.map((o: any) => (
            <div key={o.id} className="sf-summary-row">
              <span>
                #{o.id} · {o.status || "placed"}
              </span>
              <strong>{money(o.total, currency)}</strong>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
};
