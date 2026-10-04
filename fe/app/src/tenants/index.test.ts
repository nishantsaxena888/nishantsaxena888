// Tenant composition contract — merge order decides what a def.type
// resolves to: generic layout → generic surface → client override.
// Also pins the canonical-type ↔ legacy-alias mapping so old defs keep
// rendering while new configs use UI-role names.
import { describe, expect, it } from "vitest";
import { storefront_components } from "./storefront";
import { layout_components } from "./layout";
import { default_admin_component } from "./admin/admin";
import { componentsMap } from "./index";

const sf = storefront_components as Record<string, React.ComponentType<any>>;
const lx = layout_components as Record<string, React.ComponentType<any>>;

describe("generic component maps", () => {
  const CANONICAL = [
    "header",
    "footer",
    "banner",
    "listing",
    "session-list",
    "form-summary",
    "account",
    "auth-layout",
  ];
  const ALIASES: Record<string, string> = {
    "hero-section": "banner",
    "product-grid": "listing",
    products: "listing",
    "cart-view": "session-list",
    checkout: "form-summary",
    profile: "account",
    "login-layout-1": "auth-layout",
  };

  it("every canonical UI-role type exists", () => {
    for (const t of CANONICAL) {
      expect(sf[t], t).toBeTypeOf("function");
    }
  });

  it.each(Object.entries(ALIASES))(
    "legacy alias '%s' renders the same component as '%s'",
    (alias, canonical) => {
      expect(sf[alias]).toBe(sf[canonical]);
    },
  );

  it("layout primitives exist", () => {
    for (const t of ["grid", "col", "container", "section", "stack", "spacer"]) {
      expect(lx[t], t).toBeTypeOf("function");
    }
  });

  it("admin surface carries the OPTIONS-driven grid", () => {
    expect(default_admin_component["default-admin"]).toBeTypeOf("function");
  });
});

describe("merge order — client overrides last", () => {
  it("site map = layout ∪ storefront ∪ client-site", () => {
    const baked = componentsMap[Object.keys(componentsMap).find((k) => k !== "default")!];
    expect(baked.site.header).toBe(storefront_components.header);
    expect(baked.site.grid).toBe(layout_components.grid);
  });

  it("admin map = layout ∪ default-admin ∪ client-admin", () => {
    const baked = componentsMap[Object.keys(componentsMap).find((k) => k !== "default")!];
    expect(baked.admin["default-admin"]).toBe(
      default_admin_component["default-admin"],
    );
    expect(baked.admin.grid).toBe(layout_components.grid);
  });

  it("'default' fallback map exists for unknown clients", () => {
    expect(componentsMap.default.admin["default-admin"]).toBeTypeOf("function");
  });
});
