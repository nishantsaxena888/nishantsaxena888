import type { ComponentType } from "react";

// Client tenant contract — what fe/client/<name>/{site,admin}/tenant.ts
// must default-export. Keep this stable: every client folder in the repo
// conforms to it, and the loader in tenants/index.ts depends on the shape.
export interface ClientTenant {
  // def.type (from page definitions / OPTIONS content) → React component.
  // Components receive RenderComponentProps: {id, type, content, properties,
  // actionData, config, themeName}.
  components: Record<string, ComponentType<any>>;
}
