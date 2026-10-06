/**
 * Resolve a site-root-absolute asset URL ("/clients/grocery/logo.webp")
 * against the runtime base.
 *
 * Why: the Electron build ships with `base: "./"` so the bundle loads
 * over file:// — but absolute paths inside JSON definitions are not
 * rewritten by Vite. Under file://, "/x" resolves to the filesystem
 * root and every such asset 404s. On web ("/" or a subpath base) the
 * URL passes through with the base applied.
 */
export const assetUrl = (src?: string | null): string | undefined => {
  if (!src) return src ?? undefined;
  // Fully-qualified URLs pass through untouched.
  if (/^(https?:|data:|blob:|file:|asset:)/.test(src)) return src;

  const path = src.replace(/^\//, "");

  // Packaged Electron (or any file:// host): root-absolute breaks —
  // make it relative to the document.
  if (
    typeof window !== "undefined" &&
    window.location?.protocol === "file:"
  ) {
    return `./${path}`;
  }

  // Subpath-deployed web build ("./" or "/sub/") — apply the base.
  const base =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.BASE_URL) ||
    "/";
  if (base && base !== "/") {
    const prefix = base.replace(/\/+$/, "").replace(/^\.$/, ".");
    return `${prefix}/${path}`;
  }
  return src;
};
