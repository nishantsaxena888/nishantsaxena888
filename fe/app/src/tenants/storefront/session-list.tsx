import { Trash2 } from "lucide-react";
import { useEntity } from "@/engine";
import { useGenericState } from "@/store/use-generic-state";
import { useConfigStore } from "@/store/use-config-store";
import { useLanguage } from "@/components/shared/language-provider";
import { Anchor, Image, Pressable, Text, View } from "@/platform/primitives";
import { money, makeTr } from "./utils";

// Generic session-backed item list (a "cart" by config). The session
// name, continue/checkout targets and labels all come from def config —
// properties.session (default "cart"), content.continue_url,
// content.checkout_url — so the same comp serves any persisted
// item collection (wishlist, compare, order draft).
// Platform primitives — ports to RN unchanged.
export const StorefrontSessionList = ({ content, properties }: any) => {
  const tr = makeTr(useLanguage().t);
  const session = content?.session || properties?.session || "cart";
  const continueUrl = content?.continue_url || "/shop";
  const checkoutUrl = content?.checkout_url || "/checkout";
  const cartData = useGenericState((s: any) => s.data?.[session]);
  const items = Array.isArray(cartData) ? cartData : [];
  const currency = useConfigStore(
    (s: any) => s.config?.meta?.currency_symbol || "$",
  );
  const cart = useEntity(session);

  const setQty = (item: any, qty: number) => {
    if (qty <= 0) return cart.onDelete(item.id);
    cart.onUpdate(item.id, { ...item, qty });
  };

  const total = Array.isArray(items)
    ? items.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty ?? 1), 0)
    : 0;

  if (!items.length) {
    return (
      <View as="section" className="sf-session-empty">
        <Text as="h1">{content?.title || tr("cart.title", "Your cart")}</Text>
        <Text as="p">{tr("cart.empty", "Your cart is empty.")}</Text>
        <Anchor to={continueUrl} className="sf-cta">
          {tr("cart.continue_shopping", "Continue shopping")}
        </Anchor>
      </View>
    );
  }

  return (
    <View as="section" className="sf-session">
      <Text as="h1">{content?.title || tr("cart.title", "Your cart")}</Text>
      <View className="sf-summary-layout">
        <View as="ul" className="sf-session-items">
          {items.map((i: any) => (
            <View as="li" key={i.id} className="sf-session-item">
              {i.image && <Image src={i.image} alt={i.name} />}
              <View className="sf-session-item-info">
                <Text as="strong">{i.name}</Text>
                <Text>{money(i.price, currency)}</Text>
              </View>
              <View className="sf-qty">
                <Pressable onPress={() => setQty(i, (i.qty ?? 1) - 1)}>−</Pressable>
                <Text>{i.qty ?? 1}</Text>
                <Pressable onPress={() => setQty(i, (i.qty ?? 1) + 1)}>+</Pressable>
              </View>
              <Text as="strong" className="sf-line-total">
                {money((i.price ?? 0) * (i.qty ?? 1), currency)}
              </Text>
              <Pressable
                className="sf-remove"
                aria-label={tr("cart.remove", "Remove")}
                onPress={() => cart.onDelete(i.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Pressable>
            </View>
          ))}
        </View>
        <View as="aside" className="sf-summary-panel">
          <Text as="h3">{tr("checkout.order_summary", "Order summary")}</Text>
          <View className="sf-summary-row">
            <Text>{tr("cart.subtotal", "Subtotal")}</Text>
            <Text as="strong">{money(total, currency)}</Text>
          </View>
          <View className="sf-summary-row">
            <Text>{tr("cart.shipping", "Shipping")}</Text>
            <Text as="strong">{total > 30 ? "Free" : money(4.99, currency)}</Text>
          </View>
          <View className="sf-summary-total">
            <Text>{tr("cart.total", "Total")}</Text>
            <Text as="strong">
              {money(total + (total > 30 ? 0 : 4.99), currency)}
            </Text>
          </View>
          <Anchor to={checkoutUrl} className="sf-cta sf-summary-btn">
            {tr("checkout.title", "Checkout")}
          </Anchor>
        </View>
      </View>
    </View>
  );
};
