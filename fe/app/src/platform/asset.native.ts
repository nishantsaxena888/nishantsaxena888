// React Native impl — Metro resolves this over asset.ts.
// No document base / file:// on device: fully-qualified URLs pass
// through, root-absolute paths join onto apiUrl() when configured
// (remote-served assets), otherwise return untouched.
import { apiUrl } from "./env";

export const assetUrl = (src?: string | null): string | undefined => {
  if (!src) return src ?? undefined;
  if (/^(https?:|data:|blob:|file:|asset:)/.test(src)) return src;

  const path = src.replace(/^\//, "");
  const base = apiUrl()?.replace(/\/+$/, "").replace(/\/api$/, "");
  return base ? `${base}/${path}` : src;
};
