// RBAC helpers — client role comes from the login JWT's `role` claim;
// the backend enforces the same claim on entity read/write, so this file
// only drives UI filtering (menu/admin_menu entries with `roles: []`).
// Absent configuration.roles or absent item.roles → visible to everyone.
import { jwtDecode } from "jwt-decode";
import { storage } from "@/platform/storage";

// The role the current user holds: token claim, else the client's
// declared default role, else the first declared role, else "anonymous".
export function currentRole(config?: any): string {
  try {
    const token =
      typeof window !== "undefined" ? storage.getItem("token") : null;
    const claim = token ? (jwtDecode(token) as any)?.role : null;
    if (claim) return claim;
  } catch {
    // undecodable token → fall through to the declared default
  }
  const roles = config?.roles || [];
  const def = roles.find((r: any) => r?.default)?.name;
  return def || roles[0]?.name || roles[0] || "anonymous";
}

// A menu/admin_menu entry is visible when it declares no `roles`, lists
// "*", or includes the current role.
export function visibleByRole(items: any[] | undefined, role: string): any[] {
  if (!Array.isArray(items)) return [];
  return items.filter((it) => roleAllowed(it?.roles, role));
}

// Single item/def check — `roles` absent or "*" or includes role → visible.
// Used by RenderDefinition to gate whole defs (components) per role.
export function roleAllowed(allowed: any, role: string): boolean {
  return !Array.isArray(allowed) || allowed.includes("*") || allowed.includes(role);
}

// ---- Entity method RBAC -------------------------------------------------
// Declarative permission spec, identical shape in mock OPTIONS and the real
// backend response:
//   "rbac": { "viewer": ["GET"], "editor": ["GET","POST","PUT"], "admin": ["*"] }
//   "rbac": ["GET","POST"]            // flat list — applies to every role
// Absent spec → everything allowed. A role key of "*" is the fallback for
// unlisted roles; a method of "*" grants all. Methods are case-insensitive
// ("GET" ↔ "get") so spec authors can use either convention.
export type RbacSpec = Record<string, string[]> | string[] | undefined;

export function rbacMethods(spec: RbacSpec, role: string): Set<string> | null {
  if (spec === undefined || spec === null) return null; // unrestricted
  const list = Array.isArray(spec)
    ? spec
    : spec[role] || spec["*"] || [];
  if (list.includes("*")) return null; // wildcard grant = unrestricted
  return new Set(list.map((m) => String(m).toLowerCase()));
}

export function methodAllowed(spec: RbacSpec, role: string, method: string): boolean {
  const allowed = rbacMethods(spec, role);
  return allowed === null || allowed.has(String(method).toLowerCase());
}
