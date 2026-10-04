import { default_admin_component } from "./admin/admin";
import { storefront_components } from "./storefront";
import { layout_components } from "./layout";
import { client, site_tenant, admin_tenant } from "./active";
import type { ClientTenant } from "./types";

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

// Dev only: every client's surfaces are merged lazily so multiple dev
// servers (or localStorage["vite-client"]) can run different clients off
// the same tree without regenerating. Runtime import, not top-level
// await — a TLA here deadlocks the graph (index → dev-all → client comps
// → @/engine → api → mock-data → dev-all). ApiProvider awaits
// tenantsReady before reading the map. The DEV guard is statically
// replaced at build — prod never includes dev-all.ts.
export const tenantsReady: Promise<void> = import.meta.env.DEV
  ? import("./dev-all").then(({ allClients }) => {
      for (const [name, t] of Object.entries(allClients)) {
        componentsMap[name] = {
          site: { ...layout_components, ...storefront_components, ...t.site.components },
          admin: { ...layout_components, ...default_admin_component, ...t.admin.components },
        };
      }
    })
  : Promise.resolve();
