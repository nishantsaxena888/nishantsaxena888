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
  return items.filter((it) => {
    const allowed = it?.roles;
    return !Array.isArray(allowed) || allowed.includes("*") || allowed.includes(role);
  });
}
