// Shared helpers for the generic storefront components. Mock/API payloads
// arrive in several shapes — {data:[..]}, {data:{items:[..]}}, bare lists —
// so every comp unwraps through here.

export const unwrap = (v: any): any => {
  if (v == null) return v;
  if (Array.isArray(v)) return v;
  if (v.data !== undefined) return unwrap(v.data);
  return v;
};

export const listOf = (v: any): any[] => {
  const u = unwrap(v);
  if (Array.isArray(u)) return u;
  if (Array.isArray(u?.items)) return u.items;
  return [];
};

export const firstOf = (v: any): any => {
  const u = unwrap(v);
  return Array.isArray(u) ? u[0] : u;
};

export const money = (n: any, symbol = "$"): string =>
  `${symbol}${Number(n ?? 0).toFixed(2)}`;

// t() echoes the key when a translation is missing — wrap it so a
// comp's literal default survives clients without translation data.
export const makeTr =
  (t: (key: string) => string) =>
  (key: string, fallback: string): string => {
    const v = t(key);
    return v === key ? fallback : v;
  };
