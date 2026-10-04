import { default_admin_component } from "./admin/admin";
import { client, site_tenant, admin_tenant } from "./active";
import type { ClientTenant } from "./types";

// Per-client surface maps. The active client's surfaces live in
// fe/client/<name>/{site,admin}/; site routes resolve def.type against
// `site`, /admin/* routes against `admin` (generic admin + client admin
// overrides). Switch client: `npm run client <name>` regenerates
// ./active.ts.
const surfaces = {
  site: { ...site_tenant.components },
  admin: { ...default_admin_component, ...admin_tenant.components },
} satisfies Record<"site" | "admin", ClientTenant["components"]>;

export const componentsMap = {
  [client]: surfaces,
  default: { site: {}, admin: { ...default_admin_component } },
};
