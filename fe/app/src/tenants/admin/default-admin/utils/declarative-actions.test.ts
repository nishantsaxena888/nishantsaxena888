// Declarative action contract — OPTIONS JSON drives behaviour; tests pin
// the interpolation + dispatch semantics so any surface implementing the
// same contract behaves identically.
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.fn();
vi.mock("@/engine", () => ({
  apiClient: (...a: any[]) => apiClient(...a),
}));

import { interpolate, runDeclarativeAction } from "./declarative-actions";

beforeEach(() => {
  apiClient.mockReset();
  apiClient.mockResolvedValue({ data: {}, error: false });
});

describe("interpolate", () => {
  it.each([
    ["plain", "a/b", { id: 1 }, "a/b"],
    ["single field", "/items/{id}", { id: 42 }, "/items/42"],
    ["multiple", "{a}-{b}", { a: "x", b: "y" }, "x-y"],
    ["missing field → empty", "{id}/{zzz}", { id: 1 }, "1/"],
    ["undefined tpl → ''", undefined, { id: 1 }, ""],
    ["non-string coerced", "/x/{id}", { id: 0 }, "/x/0"],
  ])("%s", (_l, tpl, row, expected) => {
    expect(interpolate(tpl, row)).toBe(expected);
  });
});

describe("runDeclarativeAction", () => {
  const navigate = vi.fn();
  beforeEach(() => navigate.mockReset());

  it("navigate type — interpolated URL, no API call", async () => {
    const r = await runDeclarativeAction(
      { name: "view", type: "navigate", navigation: "/orders/{id}" },
      { id: 9 },
      { navigate },
    );
    expect(navigate).toHaveBeenCalledWith("/orders/9");
    expect(apiClient).not.toHaveBeenCalled();
    expect(r.ok).toBe(true);
  });

  it("api type — interpolated endpoint + payload", async () => {
    await runDeclarativeAction(
      {
        name: "ship",
        endpoint: "order/{id}/action/ship",
        method: "post",
        payload: { note: "hi {name}" },
      },
      { id: 5, name: "bob" },
      { navigate },
    );
    expect(apiClient).toHaveBeenCalledWith("order/5/action/ship", {
      method: "post",
      payload: { note: "hi bob" },
    });
  });

  it("defaults to <entity>/<id> when no endpoint given", async () => {
    await runDeclarativeAction({ name: "archive" }, { id: 3 }, {
      entity: "product",
      navigate,
    });
    expect(apiClient).toHaveBeenCalledWith("product/3", {
      method: "post",
      payload: undefined,
    });
  });

  it("propagates api errors as ok:false", async () => {
    apiClient.mockResolvedValue({ error: true, status_code: 500 });
    const r = await runDeclarativeAction(
      { name: "x", endpoint: "e" },
      {},
      { navigate },
    );
    expect(r.ok).toBe(false);
    expect(r.response.status_code).toBe(500);
  });

  it("export_csv is a builtin no-op for the runner", async () => {
    const r = await runDeclarativeAction(
      { name: "export_csv" },
      {},
      { navigate },
    );
    expect(r.ok).toBe(true);
    expect(apiClient).not.toHaveBeenCalled();
  });
});
