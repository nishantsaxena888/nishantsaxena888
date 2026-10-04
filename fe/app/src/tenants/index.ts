import { default_admin_component } from "./admin/admin";
import { client, site_tenant, admin_tenant } from "./active";
import type { ClientTenant } from "./types";

// Per-client component maps. The active client's surfaces live in
// fe/client/<name>/{site,admin}/ and merge with the shared admin
// components here — def.type names stay unique across surfaces.
// Switch client: `npm run client <name>` regenerates ./active.ts.
const merged: ClientTenant = {
  components: {
    ...default_admin_component,
    ...site_tenant.components,
    ...admin_tenant.components,
  },
};

export const componentsMap = {
  [client]: merged.components,
  default: { ...default_admin_component },
};
