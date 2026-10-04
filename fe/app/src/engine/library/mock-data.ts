/* eslint-disable @typescript-eslint/no-explicit-any */
// Per-client mock trees — fe/client/<name>/mock/<lang>/<endpoint>/<METHOD>/<response>.json
// plus the per-client registry fe/client/<name>/mock/config.json
// ({endpoint: {METHOD: {mock, response_type, status, delay, id, search_param}}}).
//
// Bundling:
//   PROD — tenants/mock-active.ts glob (generated) covers ONLY the baked
//          client; other clients' mock JSON is never in the bundle.
//   DEV  — tenants/dev-all.ts adds every client's glob so parallel dev
//          servers can serve any client without regenerating. The
//          import.meta.env.DEV guard is statically replaced → dropped
//          from prod bundles.
// A client with no mock/ folder gets an empty map and every call falls
// through to the real API — the ApiResponse contract never changes.
import type { ApiConfigMap } from "./api";
import { mockFiles } from "../../tenants/mock-active";
import { client as bakedClient } from "../../tenants/active";

type ResponseFiles = Record<string, any>;
type EndpointMap = Record<string, ResponseFiles>; // METHOD -> file -> json
type LangMap = Record<string, EndpointMap>;       // endpoint -> EndpointMap

const globsByClient: Record<string, Record<string, any>> = {
  [bakedClient]: mockFiles as Record<string, any>,
};

if (import.meta.env.DEV) {
  const { mockGlobs } = await import("../../tenants/dev-all");
  Object.assign(globsByClient, mockGlobs);
}

// mockDataByClient[client][lang][endpoint][METHOD][responseType] = json
export const mockDataByClient: Record<string, LangMap> = {};

// mockConfigByClient[client] = that client's endpoint registry
export const mockConfigByClient: Record<string, ApiConfigMap> = {};

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
