import { useLanguage } from "@/platform/sdk";
import { Anchor, Image, Text, View } from "@/platform/primitives";
import { firstOf, makeTr } from "./utils";

// Generic banner — the storefront hero pattern: rounded card, left-aligned
// badge + headline + subheadline + primary/secondary CTAs, right side a
// large decorative icon/image. Every field is config-driven:
//   content.hero.{badge,headline,subheadline,cta,ctaUrl,explore,exploreUrl}
//   content.icon / header record's logoIcon → right-side visual
// content.* flat fields override the nested hero block.
// Built on platform primitives — ports to RN unchanged.
export const StorefrontBanner = ({ content, actionData }: any) => {
  const tr = makeTr(useLanguage().t);
  const header = firstOf(actionData?.data?.data) || {};
  const hero = {
    ...(header.hero || {}),
    ...(content?.hero || {}),
  };
  const icon = content?.icon || hero.icon || content?.logoIcon || header.logoIcon;
  const image = content?.image || hero.image;
  const headline = content?.headline || hero.headline || content?.title || "Welcome";
  const subheadline = content?.subheadline || hero.subheadline || content?.subtitle;
  const badge = content?.badge || hero.badge;
  const cta = content?.cta || hero.cta;
  const ctaUrl = content?.ctaUrl || hero.ctaUrl || "/shop";
  const explore = content?.explore || hero.explore || tr("hero.explore", "Explore");
  const exploreUrl = content?.exploreUrl || hero.exploreUrl || "/shop";

  return (
    <View as="section" className="sf-banner">
      <View className="sf-banner-inner">
        <View className="sf-banner-copy">
          {badge && <Text className="sf-banner-badge">{badge}</Text>}
          <Text as="h1">{headline}</Text>
          {subheadline && <Text as="p">{subheadline}</Text>}
          <View className="sf-banner-actions">
            {cta && (
              <Anchor to={ctaUrl} className="sf-cta">
                {cta}
              </Anchor>
            )}
            {explore && (
              <Anchor to={exploreUrl} className="sf-cta-outline">
                {explore}
              </Anchor>
            )}
          </View>
        </View>
        {(icon || image) && (
          <View className="sf-banner-visual" aria-hidden>
            <View className="sf-banner-frame" />
            <View className="sf-banner-figure">
              {image ? <Image src={image} alt="" /> : <Text>{icon}</Text>}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
