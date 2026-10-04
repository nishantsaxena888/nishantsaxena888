import type { ComponentType, ReactNode } from "react";

// Client tenancy contract — the only types fe/client/<name>/** may import
// (type-only, enforced by the boundary eslint config). Keep this stable:
// every client folder conforms to it and the loader in tenants/index.ts
// depends on the shapes.

// Props the RenderEngine hands every component (generic + client-owned).
// `any` fields are the engine boundary — content/properties come from the
// page-definition JSON and are shaped by that def's own convention.
export interface RenderComponentProps {
  id?: string;
  type?: string;
  // Static payload from the def's `content` field.
  content?: any;
  // Def `properties` — layout/behavior flags (level, static|dynamic, ...).
  properties?: Record<string, any>;
  // Present when properties.type === "dynamic": fetched action results.
  actionData?: {
    data?: any;
    loading?: boolean;
    // Re-fire the def's action[] — type "reload" | "filter" | "search".
    action?: (req: {
      key?: string;
      type: "reload" | "filter" | "search";
      data?: any;
    }) => void;
    searchParameters?: Record<string, any>;
  };
  // Client configuration blob (menu, sessions, themes, meta, ...).
  config?: any;
  themeName?: string;
  // Rendered children of the def's children[] (layout composition).
  children?: ReactNode;
}

// What fe/client/<name>/{site,admin}/tenant.ts must default-export —
// def.type (from page definitions / OPTIONS content) → React component.
export interface ClientTenant {
  components: Record<string, ComponentType<RenderComponentProps>>;
}

// fe/client/<name>/client.json — the tenant manifest. Everything about the
// client folder is derived from this file (see scripts/client.mjs).
export interface ClientManifest {
  name: string; // must equal the folder name
  title?: string;
  surfaces: Partial<
    Record<"site" | "admin", { styles?: boolean }>
  >;
  // true → mock/<lang>/<endpoint>/... is bundled and apiClient serves it.
  mock?: boolean;
}
