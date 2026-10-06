// airbnb site tenant — every component this client's pages use lives
// in ./components (client-owned). Generic kit copies + client-specific
// comps register here; engine resolves def.type against this map.

import "./kit.css";
import { StorefrontHeader as Header } from "./components/header";
import { StorefrontBanner as Banner } from "./components/banner";
import { StorefrontListing as Listing } from "./components/listing";
import { StorefrontFooter as Footer } from "./components/footer";
import { StorefrontSessionList as SessionList } from "./components/session-list";
import { StorefrontFormSummary as FormSummary } from "./components/form-summary";
import { StorefrontAccount as Account } from "./components/account";
import { StorefrontAuthLayout as AuthLayout } from "./components/auth-layout";
import CourseList from "./components/course-list";
import Landing from "./components/landing";
import CourseDetail from "./components/course-detail";
import ChapterReader from "./components/chapter-reader";
import MdViewer from "./components/md-viewer";
import NavBack from "./components/nav-back";
import CategoryBar from "./components/category-bar";
import StayDetail from "./components/stay-detail";
import StayGrid from "./components/stay-grid";

export default {
  components: {
    header: Header,
    banner: Banner,
    listing: Listing,
    footer: Footer,
    "session-list": SessionList,
    "form-summary": FormSummary,
    account: Account,
    "auth-layout": AuthLayout,
    "hero-section": Banner,
    products: Listing,
    "product-grid": Listing,
    cards: Listing,
    "card-list": Listing,
    "card-grid": Listing,
    items: Listing,
    "item-list": SessionList,
    "cart-view": SessionList,
    checkout: FormSummary,
    profile: Account,
    "login-layout-1": AuthLayout,
    "course-list": CourseList,
    landing: Landing,
    "course-detail": CourseDetail,
    "chapter-reader": ChapterReader,
    "md-viewer": MdViewer,
    "nav-back": NavBack,
    "category-bar": CategoryBar,
    "stay-detail": StayDetail,
    "stay-grid": StayGrid,
  },
};
