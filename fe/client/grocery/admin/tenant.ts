// grocery admin tenant — store-specific admin screens on top of the
// generic OPTIONS admin (which still serves product/category/order/customer).
import GroceryOverview from "./components/grocery-overview";

export default {
  components: {
    "grocery-overview": GroceryOverview,
  },
};
