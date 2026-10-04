/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosRequestConfig, AxiosError } from "axios";

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options";
/**
 * Global variable to store the API base URL.
 * Initialized with environment variables if available.
 */
let globalApiBaseUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  "";

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

export interface ApiConfiguration {
  base_url?: string;
  config?: ApiConfigMap;
  mock_data?: MockDataConfig | string;
  lang?: string;
  default_language?: string;
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
};

export const getApiConfig = () => globalApiConfig;
export const getApiMockData = () => null;

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

  const mergedHeaders: Record<string, string> = { ...header };

  if (!mergedHeaders["Accept-Language"]) {
    mergedHeaders["Accept-Language"] = globalApiLang;
  }
  if (!mergedHeaders["lang"]) {
    mergedHeaders["lang"] = globalApiLang;
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
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

    return {
      data: null,
      details: errorData,
      error: true,
      status_code: statusCode,
      message,
    };
  }
};

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
