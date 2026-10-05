// airbnb client — stay detail page (the /stays/:id route). The def's
// action uses "listing/:id" — the engine interpolates the route param —
// so this comp gets one stay record at actionData.data.stay plus host +
// review lookups from their own actions.
//
// Heart toggles the wishlist session; Reserve drafts a trip — both go
// through props.session (SessionBridge), no store imports.
import type { RenderComponentProps } from "@/tenants/types";
import Icon from "@/platform/icons";
import { Image, Pressable, Text, View } from "@/platform/primitives";

const listOf = (v: any): any[] =>
  (Array.isArray(v) && v) || (Array.isArray(v?.items) && v.items) || [];

export const StayDetail = ({
  content,
  actionData,
  session,
  config,
}: RenderComponentProps) => {
  const stay = actionData?.data?.stay;
  const hosts = listOf(actionData?.data?.host);
  const allReviews = listOf(actionData?.data?.reviews);
  const reviews = allReviews.filter((r: any) => r.listing === stay?.title);

  const sessionName: string = content?.session || "wishlist";
  const reserveSession: string = content?.reserve_session || "trips";
  const currency = config?.meta?.currency_symbol || "₹";

  const wishedItems = session?.items(sessionName) || [];
  const wished =
    stay &&
    wishedItems.some(
      (w: any) =>
        String(typeof w === "object" && w !== null ? w.id : w) ===
        String(stay.id),
    );

  const host = hosts.find((h: any) => h.name === stay?.host);

  if (actionData?.loading && !stay) {
    return (
      <View className="ab-detail-loading">
        <Text>Loading stay…</Text>
      </View>
    );
  }
  if (!stay) {
    return (
      <View className="ab-detail-loading">
        <Text>{content?.not_found || "Stay not found."}</Text>
      </View>
    );
  }

  return (
    <View as="article" className="ab-detail">
      <View className="ab-detail-head">
        <Text as="h1">{stay.title}</Text>
        <View className="ab-detail-sub">
          {stay.rating != null && (
            <Text className="ab-rating">
              <Icon name="star" size={14} filled /> {stay.rating}
              {stay.reviews ? ` · ${stay.reviews} reviews` : ""}
            </Text>
          )}
          {stay.location && <Text className="ab-muted">· {stay.location}</Text>}
        </View>
      </View>

      <View className="ab-detail-media">
        {stay.image && <Image src={stay.image} alt={stay.title} />}
        <Pressable
          className={`ab-heart${wished ? " ab-heart--on" : ""}`}
          aria-label="Save to wishlist"
          onPress={() => session?.update(sessionName, stay)}
        >
          <Icon
            name="heart"
            size={22}
            fill={wished ? "currentColor" : "rgba(0,0,0,0.35)"}
            color={wished ? "currentColor" : "#fff"}
          />
        </Pressable>
      </View>

      <View className="ab-detail-cols">
        <View className="ab-detail-main">
          {host && (
            <View className="ab-host">
              <Text as="strong">Hosted by {host.name}</Text>
              <Text className="ab-muted">
                {host.superhost ? "Superhost · " : ""}
                hosting since {host.since} · {host.response_rate}% response
              </Text>
            </View>
          )}
          <Text className="ab-muted ab-specs">
            {stay.guests ?? "—"} guests · {stay.beds ?? "—"} beds ·{" "}
            {stay.baths ?? "—"} baths
          </Text>

          {reviews.length > 0 && (
            <View className="ab-reviews">
              <Text as="h3">Reviews</Text>
              {reviews.map((r: any) => (
                <View key={r.id} className="ab-review">
                  <Text as="strong">
                    {r.author}{" "}
                    <Text className="ab-muted">
                      ★ {r.rating} · {r.date}
                    </Text>
                  </Text>
                  <Text>{r.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="ab-book-card">
          <Text className="ab-price">
            <Text as="strong">
              {currency}
              {(stay.price ?? 0).toLocaleString()}
            </Text>{" "}
            night
          </Text>
          <Pressable
            className="ab-reserve"
            disabled={stay.available === false}
            onPress={() => session?.update(reserveSession, stay)}
          >
            {stay.available === false ? "Not available" : "Reserve"}
          </Pressable>
          {stay.available !== false && (
            <Text className="ab-muted">You won't be charged yet</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default StayDetail;
