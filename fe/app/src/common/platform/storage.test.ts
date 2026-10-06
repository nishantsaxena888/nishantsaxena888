// Platform storage seam — the contract every layer uses. Backend-swap
// semantics are what an RN port depends on (hydrated AsyncStorage impl
// injected via setStorageBackend at boot).
import { afterEach, describe, expect, it } from "vitest";
import { setStorageBackend, storage, useMemoryStorage } from "./storage";

afterEach(useMemoryStorage);

describe("storage", () => {
  it("get/set/remove roundtrip", () => {
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("missing key → null", () => {
    expect(storage.getItem("nope")).toBeNull();
  });

  it("setStorageBackend swaps the impl — RN injection point", () => {
    const calls: string[] = [];
    setStorageBackend({
      getItem: (k) => (k === "t" ? "custom" : null),
      setItem: (k) => void calls.push(k),
      removeItem: () => {},
    });
    expect(storage.getItem("t")).toBe("custom");
    storage.setItem("x", "1");
    expect(calls).toEqual(["x"]);
  });
});
