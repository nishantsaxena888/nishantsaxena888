// Session read-cache + inflight dedupe for apiClient.
//
//   OPTIONS (schemas) — cached for the session; they change only on deploy.
//   GET (lists/items) — short TTL (30s); mutations on the same endpoint
//   prefix invalidate immediately, so writes never serve stale rows.
//   Mocks pass through the same path, so dev behaviour matches prod.
//
// prefetchEntity(entity) warms options + first-page GET on nav hover —
// makes admin/page navigation feel instant without changing any UI.

type Entry = { value: any; expires: number };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<any>>();

const GET_TTL_MS = 30_000;

export function apiCacheKey(
  client: string,
  endpoint: string,
  method: string,
  params?: any,
): string {
  const qs = params
    ? "?" +
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${JSON.stringify(params[k])}`)
        .join("&")
    : "";
  return `${client}|${endpoint}|${method}${qs}`;
}

export function cacheRead(key: string): any | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (e.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return e.value;
}

export function cacheWrite(key: string, value: any, ttl = GET_TTL_MS): any {
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}

// OPTIONS/schema responses — TTL Infinity (per session).
export function cacheSchema(key: string, value: any): any {
  cache.set(key, { value, expires: Infinity });
  return value;
}

// Drop every cached entry for one client's endpoint prefix — called after
// mutations so writes never leave stale reads behind.
export function invalidateEndpoint(client: string, endpoint: string): void {
  const prefix = `${client}|${endpoint}|`;
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
}

// Dedupe identical concurrent calls — hover prefetch + render fetch share
// one request instead of firing twice.
export function deduped<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = inflight.get(key);
  if (hit) return hit as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Warm an entity's OPTIONS schema + first-page GET so navigating to its
// screen renders from cache. Fires apiClient (cache + dedupe live there).
export function prefetchEntity(entity?: string): void {
  if (!entity) return;
  // Lazy import avoids a cycle (api.ts already imports this module).
  import("./api").then(({ apiClient }) => {
    void apiClient(entity, { method: "options" });
    void apiClient(entity, { method: "get", searchParameter: { page: 1 } });
  });
}
