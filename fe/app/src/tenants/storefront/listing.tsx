import { Star } from "lucide-react";
import { useEntity } from "@/common/engine";
import { useConfigStore } from "@/common/store/use-config-store";
import { useLanguage } from "@/components/shared/use-language";
import { toast } from "@/common/lib/toast";
import { Image, Pressable, Text, View } from "@/platform/primitives";
import { listOf, money, makeTr } from "./utils";

// Generic card-grid listing. Items come from the def's dynamic action
// (actionData.data.data). The card action posts the item to a named
// session — properties.session / content.session (default "cart") —
// when that session is configured; otherwise it's a no-op with a toast,
// so the comp stays usable for any entity list on any client.
// Platform primitives — ports to RN unchanged.
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

  if (actionData?.loading) return <View className="sf-list-loading"><Text>{tr("common.loading", "Loading…")}</Text></View>;

  return (
    <View as="section" className="sf-list">
      {content?.title && <Text as="h2">{content.title}</Text>}
      <View className="sf-list-grid">
        {products.map((p: any) => (
          <View as="article" key={p.id ?? p.sku ?? p.name} className="sf-list-card">
            {p.badge && <Text className="sf-list-badge">{p.badge}</Text>}
            {p.image && (
              <Image src={p.image} alt={p.name} loading="lazy" />
            )}
            <View className="sf-list-body">
              <Text as="h3">{p.name}</Text>
              {p.rating && (
                <Text className="sf-rating">
                  <Star className="h-3.5 w-3.5" /> {p.rating}
                  {p.reviews ? ` (${p.reviews})` : ""}
                </Text>
              )}
              {p.description && <Text as="p">{p.description}</Text>}
              <View className="sf-price-row">
                <Text as="strong">{money(p.price, currency)}</Text>
                {p.originalPrice && p.originalPrice > p.price && (
                  <Text as="s">{money(p.originalPrice, currency)}</Text>
                )}
              </View>
              <Pressable
                className="sf-action-btn"
                disabled={p.stock === 0}
                onPress={() => addToCart(p)}
              >
                {p.stock === 0
                  ? tr("listing.out_of_stock", "Out of stock")
                  : tr("listing.add_to_cart", "Add to cart")}
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {!actionData?.loading && products.length === 0 && (
        <Text as="p" className="sf-empty">{tr("listing.empty", "No items found.")}</Text>
      )}
    </View>
  );
};
