// airbnb admin tenant — airbnb-specific admin screens on top of the
// generic OPTIONS admin (which still serves listing/host/booking/...).
import AirbnbOverview from "./components/airbnb-overview";

export default {
  components: {
    "airbnb-overview": AirbnbOverview,
  },
};
