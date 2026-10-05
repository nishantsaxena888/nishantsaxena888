import { Error, Home, NotFound, Public } from "@/pages";
import Protected from "@/pages/protected/protected";
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
} from "react-router-dom";

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

// Under file:// (packaged Electron) history routes have no file backing —
// a reload at /login requests a path that doesn't exist. Hash routing
// (index.html#/login) always reloads the same file, so language/client
// switches (full reloads) keep the page. Web keeps history routing.
const makeRouter =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? createHashRouter
    : createBrowserRouter;

export const createRouter = (data: any) =>
  makeRouter([
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
      // Parameterized pages — menu entries whose url carries segments
      // like /stays/:id resolve the same page def for every id.
      path: "/:slug/:id",
      element: <Public config={data} />,
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
