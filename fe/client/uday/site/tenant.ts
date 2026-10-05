// uday site tenant — Uday_AWS replica on the generic course platform:
// catalog/detail/reader components come from the storefront map
// (course-list, course-detail, chapter-reader); only the branded hero
// stays client-specific.
import UdayHero from "./components/uday-hero";

export default {
  components: {
    "uday-hero": UdayHero,
  },
};
