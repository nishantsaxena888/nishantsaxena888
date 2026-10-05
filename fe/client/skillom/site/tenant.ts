// skillom site tenant — client's own site-surface components.
// Loaded by fe/app/src/tenants/active.ts (generated); merged into the
// active client's component map. See fe/client/README.md.
// Storefront reuses the default engine components — course catalog /
// lesson player pages arrive as JSON definitions.
import ChapterReader from "./components/chapter-reader";
import CourseDetail from "./components/course-detail";
import CourseList from "./components/course-list";

export default {
  components: {
    "course-list": CourseList,
    "course-detail": CourseDetail,
    "chapter-reader": ChapterReader,
  },
};
