// uday site tenant — Uday_AWS replica on the generic course platform:
// catalog/detail/reader components come from the storefront map
// (course-list, course-detail, chapter-reader); only the branded hero
// stays client-specific. `md-*` entries render markdown directives —
// "md-githubexplorer" handles <GitHubExplorer …/> inside chapter md.
import UdayHero from "./components/uday-hero";
import MdGitHubExplorer from "./components/md-githubexplorer";

export default {
  components: {
    "uday-hero": UdayHero,
    "md-githubexplorer": MdGitHubExplorer,
  },
};
