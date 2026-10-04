// hello admin tenant — client-specific admin screens. The OPTIONS-driven
// default-admin grid still covers the todo CRUD screen; this map only adds
// what the generic admin does not (the Overview landing).
import HelloOverview from "./components/hello-overview";

export default {
  components: {
    "hello-overview": HelloOverview,
  },
};
