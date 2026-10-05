// skillom admin tenant — client-specific admin screens. The OPTIONS-driven
// default-admin covers all CRUD entities (category/course/chapter/revision/
// comment/course_release/enrollment/progress/lab_note/quiz_submission);
// this map only adds the Overview landing.
import SkillomOverview from "./components/skillom-overview";

export default {
  components: {
    "skillom-overview": SkillomOverview,
    // revision-pipeline lives in the generic admin map now
  },
};
