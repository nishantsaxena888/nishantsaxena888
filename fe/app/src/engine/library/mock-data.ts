/* eslint-disable @typescript-eslint/no-explicit-any */
// Per-client mock trees — fe/client/<name>/mock/<lang>/<endpoint>/<METHOD>/<response>.json
// plus the per-client registry fe/client/<name>/mock/config.json
// ({endpoint: {METHOD: {mock, response_type, status, delay, id, search_param}}}).
//
// Mocks are client assets: they live in the client folder and are bundled
// with the build like any other import. Delete the mock/ folder (or set
// "mock": false) when the real API takes over — the ApiResponse contract
// never changes.
import type { ApiConfigMap } from "./api";

type ResponseFiles = Record<string, any>;
type EndpointMap = Record<string, ResponseFiles>; // METHOD -> file -> json
type LangMap = Record<string, EndpointMap>;       // endpoint -> EndpointMap

const files = import.meta.glob("../../../../client/*/mock/**/*.json", {
  eager: true,
});

// mockData[client][lang][endpoint][METHOD][responseType] = json
export const mockData: Record<string, LangMap> = {};

// mockConfig[client] = the client's endpoint registry (mock/config.json)
export const mockConfig: Record<string, ApiConfigMap> = {};

for (const path in files) {
  // path: ../../../../client/<name>/mock/<...>
  const rel = path.split("/client/")[1];
  if (!rel) continue;
  const parts = rel.split("/").filter(Boolean); // [name, "mock", ...rest]
  if (parts.length < 3 || parts[1] !== "mock") continue;

  const client = parts[0];
  const json = (files[path] as any)?.default ?? files[path];

  if (parts.length === 3 && parts[2] === "config.json") {
    mockConfig[client] = json;
    continue;
  }

  // [name, "mock", lang, ...endpoint, METHOD, file.json]
  if (parts.length < 6) continue;
  const lang = parts[2];
  const file = parts[parts.length - 1].replace(/\.json$/, "");
  const method = parts[parts.length - 2];
  const endpoint = parts.slice(3, -2).join("/");

  (mockData[client] ??= {})[lang] ??= {};
  mockData[client][lang][endpoint] ??= {};
  mockData[client][lang][endpoint][method] ??= {};
  mockData[client][lang][endpoint][method][file] = json;
}
