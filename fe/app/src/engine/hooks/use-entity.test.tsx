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
