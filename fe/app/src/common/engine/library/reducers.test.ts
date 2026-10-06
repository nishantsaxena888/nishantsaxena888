// Session reducer strategies — pure functions, the session-state contract
// every surface (web/RN/desktop) shares. Table-driven: add a case, not a
// new test.
import { describe, expect, it } from "vitest";
import {
  buildConfigFromSessions,
  buildMethodFromSession,
  getSessionMatchKey,
  isRegisteredSession,
  mapFields,
  resolveReducer,
} from "./reducers";

describe("mapFields", () => {
  it.each([
    [
      "flat rename",
      { id: 1, name: "Apple", price: 1.5 },
      { unit_price: "price", name: "name" },
      { unit_price: 1.5, name: "Apple" },
    ],
    [
      "nested source path",
      { meta: { seller: { name: "Bob" } } },
      { seller: "meta.seller.name" },
      { seller: "Bob" },
    ],
    [
      "missing path resolves undefined (keeps the key)",
      { id: 1 },
      { x: "no.such.path" },
      { x: undefined },
    ],
  ])("%s", (_label, entity, mapping, expected) => {
    expect(mapFields(entity, mapping)).toEqual(expected);
  });
});

describe("array_upsert", () => {
  const upsert = resolveReducer("array_upsert")!;
  const cfg = {
    match_key: "id",
    on_match: "increment",
    increment_field: "qty",
    default_fields: { qty: 1 },
  };

  it("inserts a new row with defaults merged", () => {
    expect(upsert([], { id: 7, name: "A" }, cfg)).toEqual([
      { id: 7, name: "A", qty: 1 },
    ]);
  });

  it("increments increment_field on match", () => {
    const cur = [{ id: 7, name: "A", qty: 2 }];
    expect(upsert(cur, { id: 7 }, cfg)).toEqual([{ id: 7, name: "A", qty: 3 }]);
  });

  it("decrement removes the row at zero", () => {
    const cur = [{ id: 7, qty: 1 }];
    expect(upsert(cur, { id: 7, _operation: "decrement" }, cfg)).toEqual([]);
  });

  it("decrement above zero keeps the row", () => {
    const cur = [{ id: 7, qty: 3 }];
    expect(upsert(cur, { id: 7, _operation: "decrement" }, cfg)).toEqual([
      { id: 7, qty: 2 },
    ]);
  });

  it("'set' merges payload into the matched row", () => {
    const cur = [{ id: 7, qty: 1, name: "A" }];
    expect(upsert(cur, { id: 7, name: "B", _operation: "set" }, cfg)).toEqual([
      { id: 7, qty: 1, name: "B" },
    ]);
  });

  it("ignores payloads without the match_key", () => {
    expect(upsert([{ id: 1 }], { name: "x" }, cfg)).toEqual([{ id: 1 }]);
  });

  it("treats a non-array current state as empty", () => {
    expect(upsert(undefined, { id: 1 }, cfg)).toEqual([{ id: 1, qty: 1 }]);
  });
});

describe("array_toggle", () => {
  const toggle = resolveReducer("array_toggle")!;

  it.each([
    ["primitive add", [], 3, {}, [3]],
    ["primitive remove", [3, 4], 3, {}, [4]],
    [
      "object add",
      [{ id: 1 }],
      { id: 2 },
      { match_key: "id" },
      [{ id: 1 }, { id: 2 }],
    ],
    ["object remove", [{ id: 1 }, { id: 2 }], { id: 2 }, { match_key: "id" }, [{ id: 1 }]],
  ])("%s", (_l, cur, payload, cfg, expected) => {
    expect(toggle(cur, payload, cfg)).toEqual(expected);
  });
});

describe("array_remove / array_prepend_unique / replace / merge", () => {
  it("array_remove filters by match_key (objects and primitives)", () => {
    const rm = resolveReducer("array_remove")!;
    expect(rm([{ id: 1 }, { id: 2 }], { id: 1 }, { match_key: "id" })).toEqual([
      { id: 2 },
    ]);
    expect(rm([1, 2, 3], 2, {})).toEqual([1, 3]);
  });

  it("array_prepend_unique dedupes, prepends, trims to max_size", () => {
    const prep = resolveReducer("array_prepend_unique")!;
    const cur = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(
      prep(cur, { id: 2 }, { match_key: "id", max_size: 2 }),
    ).toEqual([{ id: 2 }, { id: 1 }]);
  });

  it("replace / merge", () => {
    expect(resolveReducer("replace")!({ a: 1 }, [5], {})).toEqual([5]);
    expect(resolveReducer("merge")!({ a: 1 }, { b: 2 }, {})).toEqual({
      a: 1,
      b: 2,
    });
  });
});

describe("session config wiring", () => {
  it("resolveReducer returns undefined for unknown strategies", () => {
    expect(resolveReducer("nope")).toBeUndefined();
  });

  it("buildConfigFromSessions maps persist + methods + registration", () => {
    const { persistentKeys, methods } = buildConfigFromSessions([
      {
        name: "cart",
        persist: true,
        method: "array_upsert",
        method_config: { match_key: "sku", increment_field: "qty" },
      },
      { name: "draft", method: "replace" },
    ]);
    expect(persistentKeys).toEqual(["cart"]);
    expect(Object.keys(methods).sort()).toEqual(["cart", "draft"]);
    expect(isRegisteredSession("cart")).toBe(true);
    expect(getSessionMatchKey("cart")).toBe("sku");
    // The built method honours its own match_key:
    expect(methods.cart([], { sku: "x" }, {})).toEqual([{ sku: "x" }]);
  });

  it("buildMethodFromSession returns undefined for unknown method", () => {
    expect(buildMethodFromSession({ method: "bogus" })).toBeUndefined();
  });
});
