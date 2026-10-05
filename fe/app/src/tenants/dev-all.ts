// GENERATED — do not edit by hand.
// `npm run client <name>` rewrites this file. Dev only: imported under
// import.meta.env.DEV so prod builds drop it completely. Dynamic imports
// (not static) — dev-all never eagerly bundles any client's code.
import type { ClientTenant } from "./types";

type TenantModule = { default: ClientTenant };
type ClientLoader = {
  site: () => Promise<TenantModule>;
  admin: () => Promise<TenantModule>;
  styles: (() => Promise<unknown>)[];
};

export const clientLoaders: Record<string, ClientLoader> = {
  airbnb: {
    site: () => import("@clients/airbnb/site/tenant"),
    admin: () => import("@clients/airbnb/admin/tenant"),
    styles: [() => import("@clients/airbnb/site/styles.css"), () => import("@clients/airbnb/admin/styles.css")],
  },
  grocery: {
    site: () => import("@clients/grocery/site/tenant"),
    admin: () => import("@clients/grocery/admin/tenant"),
    styles: [() => import("@clients/grocery/site/styles.css"), () => import("@clients/grocery/admin/styles.css")],
  },
  hello: {
    site: () => import("@clients/hello/site/tenant"),
    admin: () => import("@clients/hello/admin/tenant"),
    styles: [() => import("@clients/hello/site/styles.css"), () => import("@clients/hello/admin/styles.css")],
  },
  uday: {
    site: () => import("@clients/uday/site/tenant"),
    admin: () => import("@clients/uday/admin/tenant"),
    styles: [() => import("@clients/uday/site/styles.css"), () => import("@clients/uday/admin/styles.css")],
  },
};

// Lazy mock glob — one () => import() per JSON file, keyed by
// ../../../client/<name>/mock/<...> path. ensureClientMocks in
// engine/library/mock-data.ts loads only the requested client's prefix.
export const mockGlobs: Record<string, () => Promise<unknown>> =
  import.meta.glob("../../../client/*/mock/**/*.json");
