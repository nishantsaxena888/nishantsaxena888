import { Error, Home, NotFound, Public } from "@/pages";
import Protected from "@/pages/protected/protected";
import { createBrowserRouter, Navigate } from "react-router-dom";

import Playground from "../../pages/playground/playground";

// First visible admin_menu slug — /admin redirects there (config-driven).
const firstAdminSlug = (data: any): string => {
  const walk = (items: any[]): any[] =>
    (items || []).flatMap((i: any) =>
      i?.hide === true ? [] : [i, ...walk(i.menu), ...walk(i.sub_menu)],
    );
  const first = walk(data?.data?.admin_menu)[0];
  const url = first?.url || first?.entity || "overview";
  return String(url).replace(/^\/+|\/+$/g, "").replace(/^admin\//, "");
};

export const createRouter = (data: any) =>
  createBrowserRouter([
    {
      path: "/playground",
      element: <Playground />,
      errorElement: <Error />,
    },
    {
      path: "/admin",
      element: <Navigate to={`/admin/${firstAdminSlug(data)}`} replace />,
    },
    {
      path: "/admin/:slug",
      element: <Protected config={data} />,
      errorElement: <Error />,
    },
    {
      path: "/:slug",
      element: <Public config={data} />,
      errorElement: <Error />,
    },
    {
      path: "/",
      element: <Home config={data} />,
      errorElement: <Error />,
    },
    {
      path: "*",
      element: <NotFound />,
      errorElement: <Error />,
    },
  ]);
