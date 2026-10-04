import { Link } from "react-router-dom";
import { useLanguage } from "@/components/shared/language-provider";
import { firstOf, makeTr } from "./utils";

// Generic banner — the storefront hero pattern: rounded card, left-aligned
// badge + headline + subheadline + primary/secondary CTAs, right side a
// large decorative icon/image. Every field is config-driven:
//   content.hero.{badge,headline,subheadline,cta,ctaUrl,explore,exploreUrl}
//   content.icon / header record's logoIcon → right-side visual
// content.* flat fields override the nested hero block.
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
    <section className="sf-banner">
      <div className="sf-banner-inner">
        <div className="sf-banner-copy">
          {badge && <span className="sf-banner-badge">{badge}</span>}
          <h1>{headline}</h1>
          {subheadline && <p>{subheadline}</p>}
          <div className="sf-banner-actions">
            {cta && (
              <Link to={ctaUrl} className="sf-cta">
                {cta}
              </Link>
            )}
            {explore && (
              <Link to={exploreUrl} className="sf-cta-outline">
                {explore}
              </Link>
            )}
          </div>
        </div>
        {(icon || image) && (
          <div className="sf-banner-visual" aria-hidden>
            <div className="sf-banner-frame" />
            <div className="sf-banner-figure">
              {image ? <img src={image} alt="" /> : <span>{icon}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
