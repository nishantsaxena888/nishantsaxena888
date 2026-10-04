// RBAC helpers — role from JWT claim, config default, menu visibility.
// Pure + node-env: window/localStorage are stubbed only where the token
// path is under test, so the file stays portable to non-DOM runtimes.
import { afterEach, describe, expect, it } from "vitest";
import { currentRole, visibleByRole } from "./rbac";

const tokenWith = (claims: object) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "none" })}.${b64(claims)}.sig`;
};

const withToken = (token: string | null) => {
  (globalThis as any).window = {};
  (globalThis as any).localStorage = { getItem: () => token };
};

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
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
