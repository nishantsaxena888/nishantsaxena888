 
 
import axios, { type AxiosRequestConfig, AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { emitAppEvent } from "@/platform/host";
import { ensureClientMocks, mockConfigByClient, mockDataByClient } from "./mock-data";
import {
  apiCacheKey,
  cacheRead,
  cacheSchema,
  cacheWrite,
  deduped,
  invalidateEndpoint,
} from "./api-cache";
import { storage } from "@/platform/storage";

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options";
import { apiUrl } from "@/platform/env";

/**
 * Global variable to store the API base URL.
 * Resolved via the platform env seam (Vite env on web, setEnvConfig on RN).
 */
let globalApiBaseUrl = apiUrl() || "";

export interface MockDataEntry {
  success?: any;
  error?: any;
  error1?: any;
  [key: string]: any;
}

export type MockDataConfig = Record<
  string,
  Record<string, Record<string, MockDataEntry>>
>;

export interface EndpointConfig {
  response_type?: "success" | "error" | "error1" | string;
  method?: string;
  mock?: boolean;
  id?: string | number;
  search_param?: string | Record<string, any>;
  status?: number;
  delay?: number;
}

export type ApiConfigMap = Record<string, Record<string, EndpointConfig>>;

let globalApiConfig: ApiConfigMap | null = null;
let globalApiLang: string = "en";
let globalApiDefaultLang: string = "en";
let globalApiClient: string = "default";

export interface ApiConfiguration {
  base_url?: string;
  config?: ApiConfigMap;
  mock_data?: MockDataConfig | string;
  lang?: string;
  default_language?: string;
  client?: string;
}

/**
 * Sets the global API configuration for all future API requests.
 * (mock_data accepted for signature compatibility — ignored; no mocks.)
 */
export const setApiConfiguration = (configuration: ApiConfiguration) => {
  if (configuration.base_url !== undefined) {
    globalApiBaseUrl = configuration.base_url;
    if (typeof window !== "undefined")
      (window as any)._globalApiBaseUrl = configuration.base_url;
  }
  if (configuration.config !== undefined) {
    globalApiConfig = configuration.config;
    if (typeof window !== "undefined")
      (window as any)._globalApiConfig = configuration.config;
  }
  if (configuration.lang !== undefined) {
    globalApiLang = configuration.lang;
  }
  if (configuration.default_language !== undefined) {
    globalApiDefaultLang = configuration.default_language;
  }
  if (configuration.client !== undefined) {
    globalApiClient = configuration.client;
  }
};

export const getApiConfig = () => globalApiConfig;
export const getApiMockData = () => null;

// --- token lifecycle ------------------------------------------------------
// Sliding refresh: before a real-API call attaches the Bearer token, if the
// token is expired (or inside the skew window) we exchange it once at
// POST /api/refresh — concurrent callers share one in-flight refresh.
// A refresh 401 / dead token clears the session and emits auth-change so
// menus/gates refilter. Mock-served calls never trigger any of this.
const REFRESH_SKEW_MS = 60_000;
let refreshInFlight: Promise<void> | null = null;
let decodedExpCache: { token: string; exp: number | null } | null = null;

const tokenExp = (token: string): number | null => {
  if (decodedExpCache?.token === token) return decodedExpCache.exp;
  let exp: number | null = null;
  try {
    exp = (jwtDecode(token) as any)?.exp ?? null;
  } catch {
    exp = null;
  }
  decodedExpCache = { token, exp };
  return exp;
};

const clearSession = () => {
  storage.removeItem("token");
  emitAppEvent("auth-change");
};

async function ensureFreshToken(baseUrl: string) {
  if (typeof window === "undefined") return;
  const token = storage.getItem("token");
  if (!token) return;
  const exp = tokenExp(token);
  if (!exp || exp * 1000 - Date.now() > REFRESH_SKEW_MS) return;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await axios.post(
          `${baseUrl.replace(/\/+$/, "")}/api/refresh`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.data?.token) {
          storage.setItem("token", res.data.token);
          decodedExpCache = null;
          emitAppEvent("auth-change");
        }
      } catch (err: any) {
        // 401 → session is dead (bad sig / refresh window passed): drop it.
        // Network failure (status 0) → keep the token; the request below
        // proceeds with what we have.
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearSession();
        }
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  await refreshInFlight;
}
// ---------------------------------------------------------------------------

export interface ApiRequestOptions {
  method?: HttpMethod;
  payload?: any;
  header?: Record<string, string>;
  id?: string | number;
  searchParameter?: Record<string, any>;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  preFix?: string;
}

export interface ApiResponse<T = any> {
  data: T | null;
  details?: any;
  error: boolean;
  status_code: number;
  message: string;
}

/**
 * A reusable function to call APIs using Axios.
 *
 * @param endpoint - The API endpoint URL.
 * @param options - Configure the method, payload, headers, ID, and query parameters.
 * @returns An object containing the data, error status, status code, and message.
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse<T>> => {
  const { method = "get", payload, header, id, searchParameter, responseType = "json", preFix = "/api" } =
    options || {};

  const API_BASE_URL = globalApiBaseUrl;

  // Read-through cache — OPTIONS are session-stable, GETs short-TTL.
  // Mutations invalidate their endpoint prefix so writes never leave
  // stale reads behind. Dedupe merges prefetch + render calls into one.
  // The cache namespace carries the language too — switching lang
  // mid-session must not serve the previous language's rows.
  const cacheNs = `${globalApiClient}#${globalApiLang}`;
  const isRead = method === "get" || method === "options";
  const key = isRead
    ? apiCacheKey(cacheNs, endpoint, method, { id, ...searchParameter })
    : "";
  if (isRead) {
    const hit = cacheRead(key);
    if (hit) return hit;
  }
  const response = await (isRead ? deduped(key, run) : run());
  if (isRead && !response.error) {
    (method === "options" ? cacheSchema : cacheWrite)(key, response);
  }
  if (!isRead && !response.error) invalidateEndpoint(cacheNs, endpoint);
  return response;

  async function run() {
    // --- mock routing -------------------------------------------------------
      // Per-client registry (fe/client/<name>/mock/config.json). If the
      // endpoint+method has "mock": true, serve the file from the client's mock
      // tree; a missing file is a 404 (deliberate — flag means "this source",
      // not "try mock first"). Everything else falls through to axios.
      const mockResponse = await resolveMock(
        endpoint,
        method,
        id,
        searchParameter,
        payload,
      );
      if (mockResponse) return mockResponse as ApiResponse<T>;
    // ------------------------------------------------------------------------

    const formattedBaseUrl = API_BASE_URL
      ? API_BASE_URL.endsWith("/")
        ? API_BASE_URL.slice(0, -1)
        : API_BASE_URL
      : "";

    let formattedPrefix = "";
    if (preFix) {
      formattedPrefix = preFix.startsWith("/") ? preFix : `/${preFix}`;
      formattedPrefix = formattedPrefix.endsWith("/")
        ? formattedPrefix.slice(0, -1)
        : formattedPrefix;
    }

    const formattedEndpoint = (endpoint || "").startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    let url = `${formattedBaseUrl}${formattedPrefix}${formattedEndpoint}`;

    if (id !== undefined && id !== null) {
      url = url.endsWith("/") ? `${url}${id}` : `${url}/${id}`;
    }

    const axiosMethod = method === "options" ? "options" : method;

    // Real-API path only (mock already resolved above): refresh a dying
    // token before it rides the request.
    await ensureFreshToken(formattedBaseUrl);

    const mergedHeaders: Record<string, string> = { ...header };

    if (!mergedHeaders["Accept-Language"]) {
      mergedHeaders["Accept-Language"] = globalApiLang;
    }
    if (!mergedHeaders["lang"]) {
      mergedHeaders["lang"] = globalApiLang;
    }

    if (typeof window !== "undefined") {
      const token = storage.getItem("token");
      if (
        token &&
        !mergedHeaders["Authorization"] &&
        !mergedHeaders["authorization"]
      ) {
        mergedHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const config: AxiosRequestConfig = {
      method: axiosMethod,
      url,
      headers: mergedHeaders,
      params: searchParameter,
      data: payload,
      responseType: responseType,
    };

    try {
      const response = await axios(config);
      return {
        data: response.data,
        error: false,
        status_code: response.status,
        message: response.statusText || "Success",
      };
    } catch (error: any) {
      let statusCode = 500;
      let message = "An unexpected error occurred";
      let errorData = null;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        errorData = axiosError.response?.data || null;
        statusCode = axiosError.response?.status || 500;

        if (!axiosError.response) {
          message =
            "Network Error: Please check your internet connection. the server might be unreachable.";
          statusCode = 0;
        } else if (statusCode >= 500) {
          message =
            "Internal Server Error: Something went wrong on the server. Please try again later.";
        } else {
          message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            "An error occurred with the request";
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      // Hard 401 on a real call → session is dead server-side; drop the
      // token and notify gates (auth-change → config reload, menus
      // refilter, admin screens bounce on next mount).
      if (statusCode === 401) clearSession();

      return {
        data: null,
        details: errorData,
        error: true,
        status_code: statusCode,
        message,
      };
    }
  }
};

// --- mock writes ------------------------------------------------------------
// Mutating calls on mock-flagged endpoints actually change the data the
// demo serves: POST appends, PUT/PATCH patches by id, DELETE removes —
// applied to the endpoint's GET list. Mutations persist as a compact
// localStorage overlay (creates/updates/deletes replayed over the file),
// so the demo state survives reloads; wipe key `mockw:<c>:<l>:<ep>` to
// reset one endpoint's data.
type MockOverlay = {
  creates: any[];
  updates: Record<string, any>;
  deletes: string[];
};
const overlayKey = (ep: string) =>
  `mockw:${globalApiClient}:${globalApiLang}:${ep}`;
const mockHydrated = new Set<string>();

const readOverlay = (k: string): MockOverlay => {
  try {
    const o = JSON.parse(storage.getItem(k) || "{}");
    return { creates: o.creates || [], updates: o.updates || {}, deletes: o.deletes || [] };
  } catch {
    return { creates: [], updates: {}, deletes: [] };
  }
};

// Locate the endpoint's GET list file and hydrate it from the overlay
// once — returns the live items[] (module state, so reads afterwards see
// writes) or undefined for non-list endpoints.
const mockRows = (langTree: any, ep: string): any[] | undefined => {
  const f =
    langTree?.[globalApiLang]?.[ep]?.GET?.success ??
    langTree?.[globalApiDefaultLang]?.[ep]?.GET?.success;
  const items = Array.isArray(f) ? f : f?.items;
  if (!Array.isArray(items)) return undefined;
  const k = overlayKey(ep);
  if (!mockHydrated.has(k)) {
    mockHydrated.add(k);
    const ov = readOverlay(k);
    for (const row of ov.creates)
      if (!items.some((r: any) => String(r?.id) === String(row?.id)))
        items.push(row);
    for (const [id, patch] of Object.entries(ov.updates)) {
      const r = items.find((r: any) => String(r?.id) === id);
      if (r) Object.assign(r, patch);
    }
    if (ov.deletes.length) {
      for (let i = items.length - 1; i >= 0; i--)
        if (ov.deletes.includes(String(items[i]?.id))) items.splice(i, 1);
    }
  }
  return items;
};

const applyMockWrite = (
  langTree: any,
  ep: string,
  method: string,
  matchId: string | number | undefined,
  payload: any,
): any => {
  const items = mockRows(langTree, ep);
  if (!items) return undefined;
  const k = overlayKey(ep);
  const ov = readOverlay(k);
  let row: any;
  if (method === "post") {
    const next = items.reduce((m: number, r: any) => Math.max(m, Number(r?.id) || 0), 0) + 1;
    row = { id: next, ...(payload || {}) };
    if (!items.some((r: any) => String(r?.id) === String(row.id))) items.push(row);
    ov.creates.push(row);
  } else if (method === "put" || method === "patch") {
    row = items.find((r: any) => String(r?.id) === String(matchId));
    if (!row) return undefined;
    Object.assign(row, payload || {});
    ov.updates[String(matchId)] = { ...ov.updates[String(matchId)], ...payload };
  } else if (method === "delete") {
    const i = items.findIndex((r: any) => String(r?.id) === String(matchId));
    if (i < 0) return undefined;
    row = items.splice(i, 1)[0];
    ov.deletes.push(String(matchId));
  }
  try {
    storage.setItem(k, JSON.stringify(ov));
  } catch {
    // Overlay too large (e.g. full md rows) — session still works in-memory.
  }
  return row;
};

// --- mock resolution ------------------------------------------------------
async function resolveMock(
  endpoint: string,
  method: string,
  id: string | number | undefined,
  searchParameter?: Record<string, any>,
  payload?: any,
): Promise<ApiResponse | null> {
  // Registry from the active client's mock/config.json (bundled via the
  // generated tenant globs). In dev the per-client trees load lazily —
  // wait for them so a mock:true flag isn't read before its files are in.
  // Per-request (not a one-shot promise) so switching clients mid-session
  // also loads that client's tree on demand.
  await ensureClientMocks(globalApiClient);
  const registry = mockConfigByClient[globalApiClient];
  if (!registry) return null;

  // Mock mode from the registry itself (mock/config.json "_mode"):
  //   "loose"  (default) — flagged → mock; unflagged → real API.
  //   "strict" — flagged → mock; unflagged → 404, NEVER hits the network.
  //   "auto"   — flagged → mock; unflagged → serve a matching file if one
  //              exists in the tree, else real API.
  const mode = (registry as any)?._mode || "loose";

  // Normalize: strip slashes, fold query string into searchParameter.
  let ep = (endpoint || "").replace(/^\/+|\/+$/g, "");
  let matchId = id;
  let matchSearch = searchParameter;
  if (ep.includes("?")) {
    const [pathPart, queryPart] = ep.split("?");
    ep = pathPart;
    const parsed = Object.fromEntries(new URLSearchParams(queryPart));
    matchSearch = matchSearch ? { ...parsed, ...matchSearch } : parsed;
  }
  if (matchId === undefined && matchSearch?.id !== undefined) {
    matchId = matchSearch.id;
  }

  // Registry lookup: full path first, then parent (entity/123 → entity + id).
  let epCfg = registry[ep];
  if (!epCfg && ep.includes("/")) {
    const cut = ep.lastIndexOf("/");
    const parent = ep.slice(0, cut);
    const tail = ep.slice(cut + 1);
    if (registry[parent]) {
      epCfg = registry[parent];
      ep = parent;
      if (matchId === undefined) matchId = tail;
    }
  }
  const langTree = mockDataByClient[globalApiClient];

  // Auto mode — unflagged endpoint but a file exists → serve it.
  if (!epCfg && mode === "auto") {
    const autoFile =
      langTree?.[globalApiLang]?.[ep]?.[method.toUpperCase()]?.["success"] ??
      langTree?.[globalApiDefaultLang]?.[ep]?.[method.toUpperCase()]?.["success"];
    if (autoFile !== undefined) {
      return {
        data: autoFile,
        error: false,
        status_code: 200,
        message: "Mock data returned successfully",
      };
    }
  }

  if (!epCfg) {
    // Strict mode — unflagged endpoints never reach the network.
    return mode === "strict"
      ? {
          data: null,
          error: true,
          status_code: 404,
          message: `Mock strict: no registry entry for ${method.toUpperCase()} ${ep}`,
        }
      : null;
  }

  const detail = epCfg[method.toUpperCase()];
  if (!detail || detail.mock !== true) {
    return mode === "strict"
      ? {
          data: null,
          error: true,
          status_code: 404,
          message: `Mock strict: ${method.toUpperCase()} ${ep} not flagged mock`,
        }
      : null;
  }

  // Optional id constraint in the registry entry.
  if (detail.id !== undefined && String(detail.id) !== String(matchId)) {
    return null; // doesn't match this entry → real API
  }

  const responseType = detail.response_type || "success";
  const status = detail.status || 200;
  const delay = detail.delay !== undefined ? detail.delay : 120;

  const file =
    langTree?.[globalApiLang]?.[ep]?.[method.toUpperCase()]?.[responseType] ??
    langTree?.[globalApiDefaultLang]?.[ep]?.[method.toUpperCase()]?.[responseType];

  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  if (file === undefined) {
    console.warn("[Mock API] no file:", {
      client: globalApiClient,
      lang: globalApiLang,
      endpoint: ep,
      method: method.toUpperCase(),
      responseType,
    });
    return {
      data: null,
      error: true,
      status_code: 404,
      message: "Mock data not found for endpoint/method/responseType",
    };
  }

  // Reads hydrate prior writes from the overlay; mutations apply and the
  // mutated row is what the response carries.
  mockRows(langTree, ep);
  const writeRow = ["post", "put", "patch", "delete"].includes(method)
    ? applyMockWrite(langTree, ep, method, matchId, payload)
    : undefined;

  // Detail read — entity/:id on a list-shaped mock ({items: []}) returns
  // the single record, mirroring GET /entity/{id} on the real backend.
  // Unknown ids 404 rather than silently returning the whole list.
  const data =
    writeRow !== undefined
      ? writeRow
      : matchId !== undefined && Array.isArray((file as any)?.items)
        ? (file as any).items.find(
            (item: any) =>
              item &&
              [item.id, item.pk, item._id, item.slug, item.code].some(
                (k: any) => k != null && String(k) === String(matchId),
              ),
          )
        : file;
  if (
    matchId !== undefined &&
    Array.isArray((file as any)?.items) &&
    data === undefined
  ) {
    return {
      data: null,
      error: true,
      status_code: 404,
      message: `Mock: no ${ep} record with id ${matchId}`,
    };
  }

  const isError = ![200, 201, 202].includes(status);
  const responseObj: ApiResponse = {
    data: isError ? null : data,
    details: isError ? file : undefined,
    error: isError,
    status_code: status,
    message: isError ? "Mock Error Response" : "Mock data returned successfully",
  };
  console.log(`[Mock API] ${method.toUpperCase()} ${endpoint}`, responseObj);
  return responseObj;
}
// ---------------------------------------------------------------------------

export interface BatchApiRequest {
  endpoint: string;
  options?: ApiRequestOptions;
}

/**
 * A reusable function to call multiple APIs simultaneously.
 */
export const batchApiClient = async (
  requests: BatchApiRequest[],
): Promise<ApiResponse<any>[]> => {
  try {
    const promises = requests.map((req) =>
      apiClient(req.endpoint, req.options),
    );
    return await Promise.all(promises);
  } catch (error: any) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during batch processing";

    return requests.map(() => ({
      data: null,
      details: error,
      error: true,
      status_code: 500,
      message,
    }));
  }
};
