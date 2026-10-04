 
// Per-client mock trees — fe/client/<name>/mock/<lang>/<endpoint>/<METHOD>/<response>.json
// plus the per-client registry fe/client/<name>/mock/config.json
// ({endpoint: {METHOD: {mock, response_type, status, delay, id, search_param}}}).
//
// Bundling:
//   PROD — tenants/mock-active.ts glob (generated) covers ONLY the baked
//          client; other clients' mock JSON is never in the bundle.
//   DEV  — tenants/dev-all.ts exports one lazy () => import() per mock
//          file across every client. ensureClientMocks(client) imports
//          only the requested client's prefix, so a tree of thousands of
//          clients never ships its mocks up front.
// A client with no mock/ folder gets an empty map and every call falls
// through to the real API — the ApiResponse contract never changes.
import type { ApiConfigMap } from "./api";
import { mockFiles } from "../../tenants/mock-active";
import { client as bakedClient } from "../../tenants/active";
import { storage } from "@/platform/storage";

type ResponseFiles = Record<string, any>;
type EndpointMap = Record<string, ResponseFiles>; // METHOD -> file -> json
type LangMap = Record<string, EndpointMap>;       // endpoint -> EndpointMap

// mockDataByClient[client][lang][endpoint][METHOD][responseType] = json
export const mockDataByClient: Record<string, LangMap> = {};

// mockConfigByClient[client] = that client's endpoint registry
export const mockConfigByClient: Record<string, ApiConfigMap> = {};

function loadGlobs(globsByClient: Record<string, Record<string, any>>) {
  for (const [client, fileMap] of Object.entries(globsByClient)) {
    for (const path in fileMap) {
      // path: ../../../client/<name>/mock/<...>
      const rel = path.split("/mock/")[1];
      if (!rel) continue;
      const parts = rel.split("/").filter(Boolean);
      const json = (fileMap[path] as any)?.default ?? fileMap[path];

      if (parts.length === 1 && parts[0] === "config.json") {
        mockConfigByClient[client] = json;
        continue;
      }

      // [lang, ...endpoint, METHOD, file.json]
      if (parts.length < 4) continue;
      const lang = parts[0];
      const file = parts[parts.length - 1].replace(/\.json$/, "");
      const method = parts[parts.length - 2];
      const endpoint = parts.slice(1, -2).join("/");

      ((mockDataByClient[client] ??= {})[lang] ??= {})[endpoint] ??= {};
      mockDataByClient[client][lang][endpoint][method] ??= {};
      mockDataByClient[client][lang][endpoint][method][file] = json;
    }
  }
}

// Baked client loads synchronously — its glob is eager in mock-active.ts.
loadGlobs({ [bakedClient]: mockFiles as Record<string, any> });

const mocksLoaded = new Set<string>([bakedClient]);

// Dev: import every mock file under ../../../client/<name>/mock/ on first
// use. Idempotent; apiClient awaits this before resolveMock reads maps.
export async function ensureClientMocks(name: string): Promise<void> {
  if (!import.meta.env.DEV || !name || mocksLoaded.has(name)) return;
  mocksLoaded.add(name);
  const { mockGlobs } = await import("../../tenants/dev-all");
  const prefix = `../../../client/${name}/mock/`;
  const loaded = await Promise.all(
    Object.entries(mockGlobs)
      .filter(([p]) => p.startsWith(prefix))
      .map(async ([p, load]) => [p, await load()] as const),
  );
  loadGlobs({ [name]: Object.fromEntries(loaded) });
}

const requested =
  import.meta.env.VITE_CLIENT ||
  (typeof window !== "undefined" && storage.getItem("vite-client")) ||
  bakedClient;

// Back-compat name — resolves once the requested client's mocks are in.
// apiClient calls ensureClientMocks(globalApiClient) per request anyway,
// so switching clients mid-session also loads on demand.
export const mockReady: Promise<void> = ensureClientMocks(requested);
