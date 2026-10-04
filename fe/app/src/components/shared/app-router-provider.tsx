import { useMemo } from "react";
import { createRouter } from "./create-router";
import { RouterProvider } from "react-router-dom";
import type { genericType } from "@/types/global-types";

const AppRouterProvider = ({ data }: { data: genericType }) => {
  const appRouter = useMemo(() => createRouter(data), [data]);
  return <RouterProvider router={appRouter} />;
};
export default AppRouterProvider;
