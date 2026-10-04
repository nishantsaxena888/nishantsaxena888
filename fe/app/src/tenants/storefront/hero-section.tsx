import { Link } from "react-router-dom";
import { firstOf } from "./utils";

// Generic storefront hero. Reads content.* first, falls back to the
// header record's embedded `hero` block (ns data model).
export const StorefrontHero = ({ content, actionData }: any) => {
  const header = firstOf(actionData?.data?.data) || {};
  // content may itself carry the header record (ns static def) — merge
  // hero blocks from both sources, then flat content fields win.
  const hero = {
    ...(header.hero || {}),
    ...(content?.hero || {}),
    ...(content || {}),
  };
  return (
    <section className="sf-hero">
      {hero.badge && <span className="sf-hero-badge">{hero.badge}</span>}
      <h1>{hero.headline || content?.title || "Welcome"}</h1>
      {hero.subheadline && <p>{hero.subheadline}</p>}
      {hero.cta && (
        <Link to={hero.ctaUrl || "/shop"} className="sf-cta">
          {hero.cta}
        </Link>
      )}
    </section>
  );
};
