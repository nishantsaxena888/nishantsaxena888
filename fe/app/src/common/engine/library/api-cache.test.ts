// Read-through cache + inflight dedupe — pure, platform-agnostic.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiCacheKey,
  cacheRead,
  cacheSchema,
  cacheWrite,
  deduped,
  invalidateEndpoint,
} from "./api-cache";

const clearAll = () => {
  // No clear-exported helper — invalidate per client used in tests.
  invalidateEndpoint("c1", "ep");
  invalidateEndpoint("c2", "ep");
};
afterEach(clearAll);

describe("apiCacheKey", () => {
  it("namespaces by client, endpoint, method, sorted params", () => {
    expect(apiCacheKey("grocery", "product", "get", { b: 2, a: 1 })).toBe(
      'grocery|product|get?a=1&b=2',
    );
    // param order independence — same request, same key
    expect(apiCacheKey("grocery", "product", "get", { a: 1, b: 2 })).toBe(
      'grocery|product|get?a=1&b=2',
    );
  });

  it("different clients never collide", () => {
    expect(apiCacheKey("a", "ep", "get")).not.toBe(
      apiCacheKey("b", "ep", "get"),
    );
  });
});

describe("cacheRead / cacheWrite / cacheSchema", () => {
  it("write→read roundtrip", () => {
    cacheWrite(apiCacheKey("c1", "ep", "get"), { data: 1 });
    expect(cacheRead(apiCacheKey("c1", "ep", "get"))).toEqual({ data: 1 });
  });

  it("expired entries read as undefined", () => {
    vi.useFakeTimers();
    cacheWrite(apiCacheKey("c1", "ep", "get"), "v", 100);
    vi.advanceTimersByTime(101);
    expect(cacheRead(apiCacheKey("c1", "ep", "get"))).toBeUndefined();
    vi.useRealTimers();
  });

  it("schema entries never expire", () => {
    vi.useFakeTimers();
    cacheSchema(apiCacheKey("c1", "ep", "options"), "schema");
    vi.advanceTimersByTime(1e9);
    expect(cacheRead(apiCacheKey("c1", "ep", "options"))).toBe("schema");
    vi.useRealTimers();
  });
});

describe("invalidateEndpoint", () => {
  it("drops only the matching client+endpoint prefix", () => {
    cacheWrite(apiCacheKey("c1", "ep", "get", { p: 1 }), "a");
    cacheWrite(apiCacheKey("c1", "ep", "get", { p: 2 }), "b");
    cacheWrite(apiCacheKey("c1", "other", "get"), "keep");
    cacheWrite(apiCacheKey("c2", "ep", "get"), "other-client");
    invalidateEndpoint("c1", "ep");
    expect(cacheRead(apiCacheKey("c1", "ep", "get", { p: 1 }))).toBeUndefined();
    expect(cacheRead(apiCacheKey("c1", "ep", "get", { p: 2 }))).toBeUndefined();
    expect(cacheRead(apiCacheKey("c1", "other", "get"))).toBe("keep");
    expect(cacheRead(apiCacheKey("c2", "ep", "get"))).toBe("other-client");
  });
});

describe("deduped", () => {
  it("concurrent callers share one invocation", async () => {
    let calls = 0;
    const slow = () =>
      new Promise<string>((r) => setTimeout(() => r("x"), 5)).then((v) => {
        calls++;
        return v;
      });
    const [a, b] = await Promise.all([
      deduped("k1", slow),
      deduped("k1", slow),
    ]);
    expect(a).toBe("x");
    expect(b).toBe("x");
    expect(calls).toBe(1);
  });

  it("sequential calls after completion re-invoke", async () => {
    let calls = 0;
    const fn = () => Promise.resolve(++calls);
    await deduped("k2", fn);
    await deduped("k2", fn);
    expect(calls).toBe(2);
  });
});
