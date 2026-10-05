// useDynamicData contract: lazy actions never auto-fire (write safety),
// and action data participates in :param interpolation so a lazy
// "revision/:rid" PUT resolves from the row the component passes.
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const apiClient = vi.fn(async () => ({ error: false, data: { ok: true } }));

vi.mock("../../library/api", () => ({
  apiClient: (...a: unknown[]) => (apiClient as any)(...a),
}));
vi.mock("@/platform/navigation", () => ({
  useRouteParams: () => ({ slug: "review-queue" }),
}));

import { useDynamicData } from "./use-dynamic-data";

const def = (action: any[]) => ({
  id: "x",
  type: "any",
  content: {},
  properties: { type: "dynamic", action },
});

beforeEach(() => apiClient.mockClear());

describe("lazy actions", () => {
  it("auto-fires non-lazy only — lazy PUT never runs on mount", async () => {
    const d = def([
      { key: "rows", endpoint: "revision", method: "GET" },
      { key: "save", endpoint: "revision/:rid", method: "PUT", lazy: true,
        payload: { status: ":status" } },
    ]);
    renderHook(() => useDynamicData(d as any));
    await waitFor(() =>
      expect(apiClient).toHaveBeenCalledTimes(1),
    );
    expect(apiClient).toHaveBeenCalledWith(
      "revision",
      expect.objectContaining({ method: "get" }),
    );
  });

  it("lazy action fires on action() with :rid from data", async () => {
    const d = def([
      { key: "rows", endpoint: "revision", method: "GET" },
      { key: "save", endpoint: "revision/:rid", method: "PUT", lazy: true,
        payload: { status: ":status" } },
    ]);
    const { result } = renderHook(() => useDynamicData(d as any));
    await waitFor(() => expect(apiClient).toHaveBeenCalledTimes(1));
    await result.current.action({
      key: "save",
      type: "filter",
      data: { rid: 7, status: "published" },
    });
    expect(apiClient).toHaveBeenCalledWith(
      "revision/7",
      expect.objectContaining({
        method: "put",
        payload: { status: "published" },
      }),
    );
  });
});
