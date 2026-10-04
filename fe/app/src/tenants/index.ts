import { default_admin_component } from "./admin/admin";
import { storefront_components } from "./storefront";
import { layout_components } from "./layout";
import { client, site_tenant, admin_tenant } from "./active";
import type { ClientTenant } from "./types";
import { storage } from "@/platform/storage";
import { isDev, clientName } from "@/platform/env";

// Per-client surface maps. The active client's surfaces live in
// fe/client/<name>/{site,admin}/; site routes resolve def.type against
// `site`, /admin/* routes against `admin` (generic admin + client admin
// overrides). Switch client: `npm run client <name>` regenerates
// ./active.ts.
type Surfaces = Record<"site" | "admin", ClientTenant["components"]>;

const surfaces: Surfaces = {
  site: { ...layout_components, ...storefront_components, ...site_tenant.components },
  admin: { ...layout_components, ...default_admin_component, ...admin_tenant.components },
};

export const componentsMap: Record<string, Surfaces> = {
  [client]: surfaces,
  default: { site: {}, admin: { ...layout_components, ...default_admin_component } },
};

// Which client the runtime is asking for — VITE_CLIENT beats
// localStorage["vite-client"], baked client is the fallback. Deliberately
// does NOT check componentsMap: callers use this to know WHAT to load via
// ensureClient before looking anything up.
export const requestedClient = (): string =>
  clientName() ||
  (typeof window !== "undefined" &&
    storage.getItem("vite-client")) ||
  client;

// Lazily attach a client's surfaces in dev. dev-all.ts carries one dynamic
// import() per client — tenant code AND styles become separate chunks, so
// a tree of thousands of clients costs nothing until it is requested.
// Prod never sees dev-all (the DEV guard is statically replaced at build);
// the baked client stays eagerly bundled via active.ts.
export async function ensureClient(name: string): Promise<void> {
  if (
    !isDev() ||
    !name ||
    name === "default" ||
    componentsMap[name]
  ) {
    return;
  }
  const { clientLoaders } = await import("./dev-all");
  const l = clientLoaders[name];
  if (!l) return;
  const [site, admin] = await Promise.all([l.site(), l.admin()]);
  await Promise.all(l.styles.map((load) => load()));
  componentsMap[name] = {
    site: {
      ...layout_components,
      ...storefront_components,
      ...site.default.components,
    },
    admin: {
      ...layout_components,
      ...default_admin_component,
      ...admin.default.components,
    },
  };
}

// Resolved by ApiProvider before first render so a requested client
// (VITE_CLIENT/localStorage) has its map ready. No top-level await — the
// promise never blocks module evaluation.
export const tenantsReady: Promise<void> = isDev()
  ? ensureClient(requestedClient())
  : Promise.resolve();
