// apiClient ↔ custom mocker contract — the seam EVERY surface goes
// through. Injects synthetic registries/trees into the same maps the
// bundler fills, so these pin behaviour without depending on client data.
// Strict-mode tests double as the "no accidental network" guarantee.
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

const CLIENT = "tc";
const item = { id: 1, name: "Widget" };

// One client, all three modes exercised by flipping registry _mode.
const REGISTRY: any = {
  _mode: "strict",
  item: {
    GET: { mock: true, delay: 0 },
    OPTIONS: { mock: true, delay: 0 },
  },
  "item/{id}": {},
  order: { GET: { mock: true, delay: 0, status: 500, response_type: "err" } },
  pinned: { GET: { mock: true, delay: 0, id: "7" } },
  gone: { GET: { mock: true, delay: 0 } }, // flagged, no file
};

const TREE: any = {
  en: {
    item: { GET: { success: { items: [item] } }, OPTIONS: { success: { ui: 1 } } },
    order: { GET: { err: { message: "boom" } } },
    pinned: { GET: { success: { id: 7 } } },
    loose_only: { GET: { success: { auto: true } } },
  },
  hi: {
    item: { GET: { success: { items: [{ ...item, name: "विजेट" }] } } },
  },
};

beforeAll(() => {
  mockConfigByClient[CLIENT] = REGISTRY;
  mockDataByClient[CLIENT] = TREE;
});

beforeEach(() => {
  axiosCall.mockReset();
  axiosCall.mockResolvedValue({ data: { real: true }, status: 200, statusText: "OK" });
  setApiConfiguration({ client: CLIENT, lang: "en", default_language: "en" });
  REGISTRY._mode = "strict";
});

// Unique endpoint per test where possible — GETs are cached per
// client+endpoint+params so namespacing keeps cases independent.

describe("flagged endpoints → mock file", () => {
  it("GET serves the success file", async () => {
    const r = await apiClient("item", { method: "get" });
    expect(r.error).toBe(false);
    expect((r.data as any).items[0].name).toBe("Widget");
    expect(axiosCall).not.toHaveBeenCalled();
  });

  it("OPTIONS serves its own file", async () => {
    const r = await apiClient("item", { method: "options" });
    expect((r.data as any).ui).toBe(1);
  });

  it("language fallback — missing hi file falls to en tree", async () => {
    setApiConfiguration({ lang: "hi" });
    const r = await apiClient("item", { method: "options" });
    expect((r.data as any).ui).toBe(1); // en OPTIONS (hi lacks it)
  });

  it("present-language file wins over default", async () => {
    setApiConfiguration({ lang: "hi" });
    const r = await apiClient("item", { method: "get" });
    expect((r.data as any).items[0].name).toBe("विजेट");
  });

  it("detail path item/1 resolves parent endpoint + returns the record", async () => {
    const r = await apiClient("item/1", { method: "get" });
    expect(r.error).toBe(false);
    expect((r.data as any).id).toBe(1);
    expect((r.data as any).name).toBe("Widget");
  });

  it("detail path item/7 404s — id filtering mirrors the real API", async () => {
    const r = await apiClient("item/7", { method: "get" });
    expect(r.error).toBe(true);
    expect(r.status_code).toBe(404);
  });

  it("registry id constraint — match serves, mismatch falls through", async () => {
    REGISTRY._mode = "loose";
    const hit = await apiClient("pinned", { method: "get", id: 7 });
    expect((hit.data as any).id).toBe(7);
    const miss = await apiClient("pinned", { method: "get", id: 99 });
    expect((miss.data as any).real).toBe(true); // real axios path
    expect(axiosCall).toHaveBeenCalled();
  });
});

describe("strict mode — never the network", () => {
  it("unregistered endpoint → 404, axios untouched", async () => {
    const r = await apiClient("totally-unregistered", { method: "get" });
    expect(r.error).toBe(true);
    expect(r.status_code).toBe(404);
    expect(r.message).toContain("Mock strict");
    expect(axiosCall).not.toHaveBeenCalled();
  });

  it("registered endpoint but unflagged method → 404", async () => {
    const r = await apiClient("item", { method: "post", payload: {} });
    expect(r.status_code).toBe(404);
    expect(axiosCall).not.toHaveBeenCalled();
  });

  it("flagged-but-missing file → mock 404 (loud, no silent network)", async () => {
    const r = await apiClient("gone", { method: "get" });
    expect(r.status_code).toBe(404);
    expect(axiosCall).not.toHaveBeenCalled();
  });
});

describe("loose mode — unflagged falls to axios", () => {
  it("unknown endpoint hits the real client", async () => {
    REGISTRY._mode = "loose";
    const r = await apiClient("real-endpoint", { method: "get" });
    expect((r.data as any).real).toBe(true);
    expect(axiosCall).toHaveBeenCalledTimes(1);
  });
});

describe("auto mode — file-if-present else network", () => {
  beforeEach(() => (REGISTRY._mode = "auto"));

  it("unflagged endpoint WITH file → served", async () => {
    const r = await apiClient("loose_only", { method: "get" });
    expect((r.data as any).auto).toBe(true);
    expect(axiosCall).not.toHaveBeenCalled();
  });

  it("unflagged endpoint WITHOUT file → axios", async () => {
    const r = await apiClient("no-such-file", { method: "get" });
    expect((r.data as any).real).toBe(true);
  });
});

describe("status / response_type", () => {
  it("non-2xx status returns error with details (not data)", async () => {
    const r = await apiClient("order", { method: "get" });
    expect(r.error).toBe(true);
    expect(r.status_code).toBe(500);
    expect((r.details as any).message).toBe("boom");
    expect(r.data).toBeNull();
  });
});

describe("normalization", () => {
  it("leading/trailing slashes don't matter", async () => {
    const r = await apiClient("/item/", { method: "get" });
    expect(r.error).toBe(false);
  });

  it("query string in endpoint folds into params", async () => {
    const r = await apiClient("item?size=5", { method: "get" });
    expect(r.error).toBe(false);
  });
});

