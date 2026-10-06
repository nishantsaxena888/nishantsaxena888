import React from "react";
import { useEntity } from "@/platform/sdk";
import { useGenericState } from "@/platform/sdk";
import { useConfigStore } from "@/platform/sdk";
import { toast } from "@/platform/sdk";
import { useLanguage } from "@/platform/sdk";
import { useNav } from "@/platform/navigation";
import { Pressable, Text, TextInput, View } from "@/platform/primitives";
import { money, makeTr } from "./utils";

// Generic form + summary flow. Renders a form beside a summary of a
// named session (default "cart"); on submit it POSTs to the configured
// target entity (content.submit_entity, default "order") and clears the
// session. Field labels come from content/translations — the comp has
// no commerce-specific behavior beyond that contract.
export const StorefrontFormSummary = ({ content, properties }: any) => {
  const tr = makeTr(useLanguage().t);
  const { navigate } = useNav();
  const session = content?.session || properties?.session || "cart";
  const cartData = useGenericState((s: any) => s.data?.[session]);
  const items = Array.isArray(cartData) ? cartData : [];
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const orderEntity = content?.submit_entity || content?.order_entity || "order";
  const orders = useEntity(orderEntity);
  // Implicit RBAC — configuration rbac[orderEntity] (or OPTIONS spec)
  // decides whether this role may POST; disabled submit beats a 403.
  const canSubmit = orders.can("post");
  const cart = useEntity(session);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [placing, setPlacing] = React.useState(false);

  const total = items.reduce(
    (s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1),
    0,
  );

  const set = (k: string) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const placeOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!items.length) {
      toast.info(tr("cart.empty", "Your cart is empty"));
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
      toast.error(tr("checkout.error", "Could not place the order"));
      return;
    }
    for (const i of items) await cart.onDelete(i.id);
    toast.success(tr("checkout.thank_you", "Order placed — thank you!"));
    navigate(content?.success_url || "/");
  };

  const field = (key: string, label: string, extra: any = {}) => (
    <View as="label" className="sf-field" key={key}>
      <Text>{label}</Text>
      <TextInput required onChangeText={set(key)} {...extra} />
    </View>
  );

  return (
    <View as="section" className="sf-form-view">
      <Text as="h1">{content?.title || tr("checkout.title", "Checkout")}</Text>
      <View className="sf-summary-layout">
        <View as="form" className="sf-summary-form" onSubmit={placeOrder}>
          <Text as="h3">{tr("checkout.contact", "Contact")}</Text>
          {field("name", tr("address.full_name", "Full name"))}
          {field("email", tr("auth.email", "Email"), { type: "email" })}
          {field("phone", tr("address.phone", "Phone"), { type: "tel" })}
          <Text as="h3">{tr("address.delivery_title", "Delivery")}</Text>
          {field("address", tr("address.street", "Address"))}
          {field("city", tr("address.city", "City"))}
          {field("zip", tr("address.zip", "ZIP / PIN"))}
          <Pressable type="submit" className="sf-cta" disabled={placing || !canSubmit}>
            {!canSubmit
              ? tr("checkout.not_permitted", "Not permitted")
              : placing
                ? "…"
                : `${tr("checkout.place_order", "Place order")} · ${money(total, currency)}`}
          </Pressable>
        </View>
        <View as="aside" className="sf-summary-panel">
          <Text as="h3">{items.length} item(s)</Text>
          {items.map((i: any) => (
            <View key={i.id} className="sf-summary-row">
              <Text>
                {i.name} × {i.qty ?? 1}
              </Text>
              <Text as="strong">{money((i.price ?? 0) * (i.qty ?? 1), currency)}</Text>
            </View>
          ))}
          <View className="sf-summary-total">
            <Text>{tr("cart.total", "Total")}</Text>
            <Text as="strong">{money(total, currency)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
