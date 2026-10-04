import "./storefront.css";
import { StorefrontHeader } from "./header";
import { StorefrontBanner } from "./banner";
import { StorefrontListing } from "./listing";
import { StorefrontFooter } from "./footer";
import { StorefrontSessionList } from "./session-list";
import { StorefrontFormSummary } from "./form-summary";
import { StorefrontAccount } from "./account";
import { StorefrontAuthLayout } from "./auth-layout";

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
  banner: StorefrontBanner,
  listing: StorefrontListing,
  footer: StorefrontFooter,
  "session-list": StorefrontSessionList,
  "form-summary": StorefrontFormSummary,
  account: StorefrontAccount,
  "auth-layout": StorefrontAuthLayout,
  // legacy aliases (same comps, old type names)
  "hero-section": StorefrontBanner,
  products: StorefrontListing,
  "cart-view": StorefrontSessionList,
  checkout: StorefrontFormSummary,
  profile: StorefrontAccount,
  "login-layout-1": StorefrontAuthLayout,
};
