import "./storefront.css";
import { StorefrontHeader } from "./header";
import { StorefrontHero } from "./hero-section";
import { StorefrontProducts } from "./products";
import { StorefrontFooter } from "./footer";
import { StorefrontCartView } from "./cart-view";
import { StorefrontCheckout } from "./checkout";
import { StorefrontProfile } from "./profile";
import { StorefrontLoginLayout } from "./login-layout-1";

// Generic storefront building blocks — available to every client's site
// surface. Type names are domain-neutral UI roles; the domain words
// (product, cart, order) live in the def's labels/config, not the type:
//
//   banner        media + headline + CTA band
//   listing       card grid; item action posts to a named session
//   session-list  renders a named session as an editable item list + totals
//   form-summary  form beside the session summary → POSTs to submit_entity
//   account       record form + related list
//   auth-layout   auth card variants (login/register/reset/verify)
//   header/footer page chrome
//
// Legacy type names are kept as aliases so ported defs still resolve —
// new defs should use the canonical names above.
export const storefront_components = {
  // canonical, domain-neutral
  header: StorefrontHeader,
  banner: StorefrontHero,
  listing: StorefrontProducts,
  footer: StorefrontFooter,
  "session-list": StorefrontCartView,
  "form-summary": StorefrontCheckout,
  account: StorefrontProfile,
  "auth-layout": StorefrontLoginLayout,
  // legacy aliases (same comps, old type names)
  "hero-section": StorefrontHero,
  products: StorefrontProducts,
  "cart-view": StorefrontCartView,
  checkout: StorefrontCheckout,
  profile: StorefrontProfile,
  "login-layout-1": StorefrontLoginLayout,
};
