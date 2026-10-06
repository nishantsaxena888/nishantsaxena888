// apiClient token lifecycle — jsdom because the Bearer path is
// window-gated (storage seam + axios). Pins: near-expiry tokens refresh
// once at POST /api/refresh, concurrent calls share the in-flight
// refresh, a refresh 401 clears the session, and a real-API 401 clears
// it too — all broadcasting auth-change so gates refilter.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const axiosCall = vi.fn();
const axiosPost = vi.fn();
vi.mock("axios", () => ({
  default: Object.assign((...a: any[]) => axiosCall(...a), {
    post: (...a: any[]) => axiosPost(...a),
    isAxiosError: (e: any) => !!e?.isAxiosError,
  }),
}));

import { apiClient, setApiConfiguration } from "./api";
import { mockConfigByClient, mockDataByClient } from "./mock-data";
import { storage } from "@/platform/storage";
import { onAppEvent } from "@/platform/host";

const CLIENT = "tc-auth";
const REGISTRY: any = { _mode: "loose" }; // unflagged → real axios path

beforeAll(() => {
  mockConfigByClient[CLIENT] = REGISTRY;
  mockDataByClient[CLIENT] = { en: {} };
});

const jwt = (exp: number, role = "admin") =>
  `h.${btoa(JSON.stringify({ exp, role }))}.s`;
const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 3600;

beforeEach(() => {
  storage.removeItem("token");
  axiosCall.mockReset();
  axiosCall.mockResolvedValue({ data: { ok: 1 }, status: 200, statusText: "OK" });
  axiosPost.mockReset();
  setApiConfiguration({ client: CLIENT, lang: "en", default_language: "en" });
});

describe("token lifecycle — sliding refresh", () => {
  it("fresh token → request rides it, no refresh call", async () => {
    storage.setItem("token", jwt(FUTURE));
    await apiClient("nocache_fresh", { method: "post", payload: {} });
    expect(axiosPost).not.toHaveBeenCalled();
    expect(axiosCall.mock.calls[0][0].headers.Authorization).toBe(
      `Bearer ${jwt(FUTURE)}`,
    );
  });

  it("expired token → refresh once, request carries the new token", async () => {
    const fresh = jwt(FUTURE);
    storage.setItem("token", jwt(PAST));
    axiosPost.mockResolvedValueOnce({ data: { token: fresh } });
    await apiClient("nocache_renew", { method: "post", payload: {} });
    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost.mock.calls[0][0]).toContain("/api/refresh");
    expect(storage.getItem("token")).toBe(fresh);
    expect(axiosCall.mock.calls[0][0].headers.Authorization).toBe(
      `Bearer ${fresh}`,
    );
  });

  it("concurrent calls share one in-flight refresh", async () => {
    storage.setItem("token", jwt(PAST));
    axiosPost.mockResolvedValue({ data: { token: jwt(FUTURE) } });
    await Promise.all([
      apiClient("nocache_c1", { method: "post", payload: {} }),
      apiClient("nocache_c2", { method: "post", payload: {} }),
    ]);
    expect(axiosPost).toHaveBeenCalledTimes(1);
  });

  it("refresh 401 → token cleared + auth-change fires", async () => {
    const events: string[] = [];
    const off = onAppEvent("auth-change", () => events.push("x"));
    storage.setItem("token", jwt(PAST));
    axiosPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });
    await apiClient("nocache_dead", { method: "post", payload: {} });
    expect(storage.getItem("token")).toBeNull();
    expect(events.length).toBe(1);
    expect(axiosCall.mock.calls[0][0].headers.Authorization).toBeUndefined();
    off();
  });

  it("real API 401 response → session cleared", async () => {
    storage.setItem("token", jwt(FUTURE));
    axiosCall.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    });
    const r = await apiClient("nocache_401", { method: "post", payload: {} });
    expect(r.status_code).toBe(401);
    expect(storage.getItem("token")).toBeNull();
  });

  it("no token → request goes out unauthenticated, no refresh", async () => {
    await apiClient("nocache_anon", { method: "post", payload: {} });
    expect(axiosPost).not.toHaveBeenCalled();
    expect(axiosCall.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });
});
