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
// surface (the "default tenant" of the storefront model). Def types match
// the source naming so existing page definitions port verbatim.
export const storefront_components = {
  header: StorefrontHeader,
  "hero-section": StorefrontHero,
  products: StorefrontProducts,
  footer: StorefrontFooter,
  "cart-view": StorefrontCartView,
  checkout: StorefrontCheckout,
  profile: StorefrontProfile,
  "login-layout-1": StorefrontLoginLayout,
};
