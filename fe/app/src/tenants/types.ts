import type { ComponentType, ReactNode } from "react";

// Client tenancy contract — the only types fe/client/<name>/** may import
// (type-only, enforced by the boundary eslint config). Keep this stable:
// every client folder conforms to it and the loader in tenants/index.ts
// depends on the shapes.

// Props the RenderEngine hands every component (generic + client-owned).
// `content`/`properties` come from the page-definition JSON — components
// may tighten them via generics, e.g.
//   RenderComponentProps<{ title: string }, { session: string }>
// The JSON itself stays untyped at the boundary; the generic documents and
// checks the shape the comp expects (validate-defs checks it at the edge).
export interface RenderComponentProps<
  TContent = any,
  TProperties extends Record<string, any> = Record<string, any>,
> {
  id?: string;
  type?: string;
  // Static payload from the def's `content` field.
  content?: TContent;
  // Def `properties` — layout/behavior flags (level, static|dynamic, ...).
  properties?: TProperties;
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
  // Session bridge — read/write configured sessions (cart, wishlist,
  // compare, ...) without importing the store. items(name) → session
  // array; update(name, value) runs the session's configured reducer
  // strategy; clear(name) empties it.
  session?: {
    items: (name: string) => any[];
    update: (name: string, value: any) => void;
    clear: (name: string) => void;
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
