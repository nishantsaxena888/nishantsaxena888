import "./storefront.css";
import { StorefrontHeader } from "./header";
import { StorefrontBanner } from "./banner";
import { StorefrontListing } from "./listing";
import { StorefrontFooter } from "./footer";
import { StorefrontSessionList } from "./session-list";
import { StorefrontFormSummary } from "./form-summary";
import { StorefrontAccount } from "./account";
import { StorefrontAuthLayout } from "./auth-layout";
import CourseList from "./course-list";
import CourseDetail from "./course-detail";
import ChapterReader from "./chapter-reader";

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
// Learning-platform building blocks (course clients — skillom, uday, …):
//   course-list     card grid → detail_path route (default /courses/:id)
//   course-detail   header + ordered child list → reader_path (/learn/:id)
//   chapter-reader  md_content → typed widgets (quiz/callouts/video…)
//                   via md-sections; progress session + lazy entity writes
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
  // aliases (same comps — legacy domain names + generic synonyms)
  "hero-section": StorefrontBanner,
  products: StorefrontListing,
  "product-grid": StorefrontListing,
  cards: StorefrontListing,
  "card-list": StorefrontListing,
  "card-grid": StorefrontListing,
  items: StorefrontListing,
  "item-list": StorefrontSessionList,
  "cart-view": StorefrontSessionList,
  checkout: StorefrontFormSummary,
  profile: StorefrontAccount,
  "login-layout-1": StorefrontAuthLayout,
  // learning platform
  "course-list": CourseList,
  "course-detail": CourseDetail,
  "chapter-reader": ChapterReader,
};
