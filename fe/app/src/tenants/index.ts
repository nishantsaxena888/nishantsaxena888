import { default_admin_component } from "./admin/admin";
import { client, site_tenant, admin_tenant } from "./active";
import type { ClientTenant } from "./types";

// Per-client surface maps. The active client's surfaces live in
// fe/client/<name>/{site,admin}/; site routes resolve def.type against
// `site`, /admin/* routes against `admin` (generic admin + client admin
// overrides). Switch client: `npm run client <name>` regenerates
// ./active.ts.
type Surfaces = Record<"site" | "admin", ClientTenant["components"]>;

const surfaces: Surfaces = {
  site: { ...site_tenant.components },
  admin: { ...default_admin_component, ...admin_tenant.components },
};

export const componentsMap: Record<string, Surfaces> = {
  [client]: surfaces,
  default: { site: {}, admin: { ...default_admin_component } },
};

// Dev only: every client's surfaces are available so multiple dev servers
// (or localStorage["vite-client"]) can run different clients off the same
// tree without regenerating. The DEV guard is statically replaced at build
// — prod bundles never include dev-all.ts or other clients' code.
if (import.meta.env.DEV) {
  const { allClients } = await import("./dev-all");
  for (const [name, t] of Object.entries(allClients)) {
    componentsMap[name] = {
      site: { ...t.site.components },
      admin: { ...default_admin_component, ...t.admin.components },
    };
  }
}
