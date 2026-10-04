// RBAC helpers — role from JWT claim, config default, menu visibility.
// Pure + node-env: the storage backend is stubbed via the platform seam
// (setStorageBackend) — the same seam an RN port injects AsyncStorage at.
import { afterEach, describe, expect, it } from "vitest";
import {
  currentRole,
  methodAllowed,
  rbacMethods,
  roleAllowed,
  visibleByRole,
} from "./rbac";
import { setStorageBackend, useMemoryStorage } from "@/platform/storage";

const tokenWith = (claims: object) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "none" })}.${b64(claims)}.sig`;
};

const withToken = (token: string | null) => {
  (globalThis as any).window = {};
  setStorageBackend({
    getItem: () => token,
    setItem: () => {},
    removeItem: () => {},
  });
};

afterEach(() => {
  delete (globalThis as any).window;
  useMemoryStorage();
});

describe("currentRole", () => {
  it("no token + config default → declared default role", () => {
    expect(
      currentRole({
        roles: [{ name: "viewer", default: true }, { name: "admin" }],
      }),
    ).toBe("viewer");
  });

  it("no token + no config → 'anonymous'", () => {
    expect(currentRole(undefined)).toBe("anonymous");
    expect(currentRole({ roles: [] })).toBe("anonymous");
  });

  it("no default declared → first role wins", () => {
    expect(currentRole({ roles: ["admin", "viewer"] })).toBe("admin");
  });

  it("token claim beats the configured default", () => {
    withToken(tokenWith({ role: "admin" }));
    expect(
      currentRole({ roles: [{ name: "viewer", default: true }] }),
    ).toBe("admin");
  });

  it("garbage token falls back to default (no throw)", () => {
    withToken("not-a-jwt");
    expect(
      currentRole({ roles: [{ name: "viewer", default: true }] }),
    ).toBe("viewer");
  });
});

describe("visibleByRole", () => {
  const menu = [
    { url: "/", title: "Home" }, // no roles → everyone
    { url: "/admin", title: "Admin", roles: ["admin"] },
    { url: "/staff", title: "Staff", roles: ["admin", "editor"] },
    { url: "/all", title: "All", roles: ["*"] },
  ];

  it.each([
    ["viewer", ["/", "/all"]],
    ["admin", ["/", "/admin", "/staff", "/all"]],
    ["editor", ["/", "/staff", "/all"]],
  ])("role '%s' sees %j", (role, urls) => {
    expect(visibleByRole(menu, role).map((m) => m.url)).toEqual(urls);
  });

  it("non-array input → empty", () => {
    expect(visibleByRole(undefined, "admin")).toEqual([]);
  });
});

describe("roleAllowed (def-level gating)", () => {
  it.each([
    [undefined, "viewer", true],
    [["*"], "viewer", true],
    [["admin"], "admin", true],
    [["admin"], "viewer", false],
    [["admin", "editor"], "editor", true],
    [[], "admin", false], // empty whitelist = nobody allowed
  ])("roles=%j for '%s' → %s", (allowed, role, want) => {
    expect(roleAllowed(allowed, role)).toBe(want);
  });
});

// Entity method RBAC — the spec OPTIONS/configuration carries; useEntity
// gates every CRUD call on methodAllowed().
describe("methodAllowed (entity CRUD RBAC)", () => {
  const spec = {
    viewer: ["GET"],
    editor: ["GET", "POST", "PUT"],
    admin: ["*"],
  };

  it.each([
    // [spec, role, method, allowed]
    [undefined, "viewer", "delete", true], // no spec → unrestricted
    [spec, "viewer", "get", true],
    [spec, "viewer", "GET", true], // case-insensitive
    [spec, "viewer", "post", false],
    [spec, "viewer", "delete", false],
    [spec, "editor", "put", true],
    [spec, "editor", "delete", false],
    [spec, "admin", "delete", true], // "*" grants all
    [spec, "admin", "options", true],
    [["GET"], "anyone", "get", true], // flat list → all roles
    [["GET"], "anyone", "post", false],
    [{ "*": ["GET"] }, "nobody", "get", true], // "*" role = fallback
    [{ "*": ["GET"] }, "nobody", "post", false],
  ])("spec=%j role='%s' method='%s' → %s", (s, role, method, want) => {
    expect(methodAllowed(s as any, role, method)).toBe(want);
  });

  it("rbacMethods returns null for unrestricted/wildcard", () => {
    expect(rbacMethods(undefined, "viewer")).toBeNull();
    expect(rbacMethods({ admin: ["*"] }, "admin")).toBeNull();
    expect(rbacMethods({ viewer: ["GET"] }, "viewer")).toEqual(
      new Set(["get"]),
    );
  });
});
