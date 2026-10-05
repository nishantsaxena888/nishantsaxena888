// useEntity RBAC contract — the hook is the single gate for every CRUD
// call (site + admin both funnel through it). Pin: can() reflects the
// spec, and a denied method never reaches apiClient (defense in depth —
// the backend still enforces, the client just never tries).
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useEntity } from "./use-entity";
import { useConfigStore } from "@/store/use-config-store";
import { useMemoryStorage } from "@/platform/storage";

const api = vi.hoisted(() => ({ calls: [] as any[] }));
vi.mock("../library/api", () => ({
  apiClient: vi.fn(async (entity: string, req: any) => {
    api.calls.push([entity, req.method]);
    return { data: { items: [], total: 0 }, error: false, status_code: 200 };
  }),
}));
import { apiClient } from "../library/api";

const RBAC = {
  // Backend-shaped spec: action → role whitelist (entities.py "rbac").
  rbac: { item: { read: "*", write: ["admin"] } },
  roles: [{ name: "viewer", default: true }],
};

beforeEach(() => {
  api.calls.length = 0;
  // Memory backend → no token → currentRole falls to config default "viewer".
  useMemoryStorage();
  useConfigStore.setState({ config: RBAC });
});

describe("useEntity — centralized RBAC", () => {
  it("can() reflects configuration rbac for the current role", async () => {
    const { result } = renderHook(() => useEntity("item"));
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));
    expect(result.current.can("get")).toBe(true);
    expect(result.current.can("post")).toBe(false);
    expect(result.current.can("delete")).toBe(false);
  });

  it("denied method returns 403 without touching apiClient", async () => {
    const { result } = renderHook(() => useEntity("item"));
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));
    (apiClient as any).mockClear();
    const res = await result.current.onPost({ name: "x" });
    expect(res.status_code).toBe(403);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it("options.rbac prop overrides configuration rbac", async () => {
    const { result } = renderHook(() =>
      useEntity("item", { rbac: { read: "*", write: "*" } }),
    );
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));
    expect(result.current.can("delete")).toBe(true);
    const res = await result.current.onPost({ name: "x" });
    expect(res.error).toBe(false);
  });

  it("no spec → unrestricted", async () => {
    useConfigStore.setState({ config: { rbac: {} } });
    const { result } = renderHook(() => useEntity("other"));
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));
    expect(result.current.can("delete")).toBe(true);
  });
});

describe("useEntity — optimistic mutations", () => {
  const OPEN = { rbac: { read: "*", write: "*" } };

  it("optimistic post shows item before resolve, rolls back on error", async () => {
    const { result } = renderHook(() =>
      useEntity("item", {
        optimistic: true,
        onMutationReload: false,
        rbac: OPEN.rbac as any,
      }),
    );
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));

    // Defer the POST response so the optimistic window is observable.
    let resolvePost: (v: any) => void = () => {};
    (apiClient as any).mockImplementationOnce(
      () => new Promise((r) => (resolvePost = r)),
    );

    let posted: Promise<any> = Promise.resolve();
    await vi.waitFor(async () => {
      posted = result.current.onPost({ name: "temp" });
      expect(
        result.current.list.some((i: any) => i._optimistic === true),
      ).toBe(true);
    });

    resolvePost({ data: null, error: true, status_code: 500, message: "x" });
    await posted;
    await waitFor(() =>
      expect(
        result.current.list.every((i: any) => i._optimistic !== true),
      ).toBe(true),
    );
  });

  it("optimistic delete hides the row until the response lands", async () => {
    // GET seeds one row — OPTIONS/other calls fall through to the default.
    (apiClient as any).mockImplementation(async (_e: string, req: any) =>
      req.method === "get"
        ? {
            data: { items: [{ id: 9, name: "seed" }], total: 1 },
            error: false,
            status_code: 200,
          }
        : { data: { items: [], total: 0 }, error: false, status_code: 200 },
    );
    const { result } = renderHook(() =>
      useEntity("item", {
        optimistic: true,
        onMutationReload: false,
        rbac: OPEN.rbac as any,
      }),
    );
    await waitFor(() =>
      expect(result.current.list.some((i: any) => i.id === 9)).toBe(true),
    );

    let resolveDel: (v: any) => void = () => {};
    (apiClient as any).mockImplementationOnce(
      () => new Promise((r) => (resolveDel = r)),
    );
    const done = result.current.onDelete(9);
    await waitFor(() =>
      expect(result.current.list.some((i: any) => i.id === 9)).toBe(false),
    );

    resolveDel({ data: null, error: true, status_code: 500, message: "x" });
    await done;
    await waitFor(() =>
      expect(result.current.list.some((i: any) => i.id === 9)).toBe(true),
    );
  });

  it("non-optimistic mode leaves the list untouched", async () => {
    const { result } = renderHook(() =>
      useEntity("item", { onMutationReload: false, rbac: OPEN.rbac as any }),
    );
    await waitFor(() => expect(result.current.isSkeleton).toBe(false));
    await result.current.onPost({ name: "temp" });
    expect(result.current.list.some((i: any) => i._optimistic)).toBe(false);
  });
});
