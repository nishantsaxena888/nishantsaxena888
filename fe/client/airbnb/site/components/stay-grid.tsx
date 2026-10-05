// airbnb client — stay card grid. Two modes, one comp:
//
//   dynamic  — def.properties.action fetches an entity list
//              (actionData.data.data → {items}); ?cat=<category> in the
//              URL filters the grid client-side (category-bar sets it).
//   session  — properties.source === "session:<name>" renders the named
//              session's items (wishlist page uses "session:wishlist").
//
// The heart overlay toggles the item in the configured session via
// props.session — the engine's SessionBridge (configuration.sessions
// reducers apply). Currency comes from props.config.meta — no engine
// imports; client-boundary compliant.
import type { RenderComponentProps } from "@/tenants/types";
import { useQuery } from "@/platform/navigation";
import Icon from "@/platform/icons";
import { Image, Pressable, Text, View } from "@/platform/primitives";

const listOf = (v: any): any[] =>
  (Array.isArray(v) && v) || (Array.isArray(v?.items) && v.items) || [];

export const StayGrid = ({
  content,
  properties,
  actionData,
  session,
  config,
}: RenderComponentProps) => {
  const q = useQuery();
  const sessionName: string =
    content?.session || properties?.session || "wishlist";
  const source: string = properties?.source || "dynamic";
  const sourceSession = source.startsWith("session:")
    ? source.slice(8)
    : null;

  const currency = config?.meta?.currency_symbol || "₹";
  const wishedItems = session?.items(sessionName) || [];
  const wished = (item: any) =>
    wishedItems.some(
      (w: any) =>
        String(typeof w === "object" && w !== null ? w.id : w) ===
        String(item.id),
    );

  const raw = sourceSession
    ? session?.items(sourceSession) || []
    : listOf(actionData?.data?.data);
  const cat = q("cat") || "";
  const items = cat ? raw.filter((l: any) => l.category === cat) : raw;
  const loading = !sourceSession && actionData?.loading;

  if (loading && raw.length === 0) {
    return (
      <View className="ab-grid-loading">
        <Text>Loading stays…</Text>
      </View>
    );
  }

  return (
    <View as="section" className="ab-stays">
      {content?.title && <Text as="h2">{content.title}</Text>}
      <View className="ab-grid">
        {items.map((l: any) => (
          <View as="article" key={l.id ?? l.title} className="ab-card">
            <View className="ab-card-media">
              {l.image && <Image src={l.image} alt={l.title} loading="lazy" />}
              {l.badge && <Text className="ab-card-badge">{l.badge}</Text>}
              <Pressable
                className={`ab-heart${wished(l) ? " ab-heart--on" : ""}`}
                aria-label="Save to wishlist"
                onPress={() => session?.update(sessionName, l)}
              >
                <Icon
                  name="heart"
                  size={20}
                  fill={wished(l) ? "currentColor" : "rgba(0,0,0,0.35)"}
                  color={wished(l) ? "currentColor" : "#fff"}
                />
              </Pressable>
            </View>
            <View className="ab-card-body">
              <View className="ab-card-row">
                <Text as="h3">{l.title}</Text>
                {l.rating != null && (
                  <Text className="ab-rating">
                    <Icon name="star" size={14} filled /> {l.rating}
                  </Text>
                )}
              </View>
              {l.location && <Text className="ab-muted">{l.location}</Text>}
              {(l.beds || l.baths) && (
                <Text className="ab-muted">
                  {l.guests ? `${l.guests} guests · ` : ""}
                  {l.beds ? `${l.beds} beds · ` : ""}
                  {l.baths ? `${l.baths} baths` : ""}
                </Text>
              )}
              <Text className="ab-price">
                <Text as="strong">
                  {currency}
                  {(l.price ?? 0).toLocaleString()}
                </Text>{" "}
                night
              </Text>
            </View>
          </View>
        ))}
      </View>
      {!loading && items.length === 0 && (
        <Text as="p" className="ab-empty">
          {sourceSession
            ? content?.empty_text || "Nothing saved yet — tap a heart on any stay."
            : content?.empty_text || "No stays found."}
        </Text>
      )}
    </View>
  );
};

export default StayGrid;
