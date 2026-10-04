// Field visibility contract — `visible` rules on form inputs, ops
// mirrored with the backend filter ops.
import { describe, expect, it } from "vitest";
import { evalVisibility } from "./use-form-itrator";

const V = { type: "physical", price: 30, tags: ["a", "b"], name: "Pro" };

describe("evalVisibility", () => {
  it.each([
    // single rule object
    [{ field: "type", operator: "eq", value: "physical" }, true],
    [{ field: "type", operator: "===", value: "digital" }, false],
    [{ field: "type", operator: "ne", value: "digital" }, true],
    [{ field: "price", operator: "gt", value: 10 }, true],
    [{ field: "price", operator: "gte", value: 30 }, true],
    [{ field: "price", operator: "lt", value: 30 }, false],
    [{ field: "price", operator: "lte", value: 30 }, true],
    [{ field: "name", operator: "contains", value: "pro" }, true],
    [{ field: "tags", operator: "in", value: "a" }, true],
    [{ field: "type", operator: "in", value: ["digital", "physical"] }, true],
    [{ field: "type", operator: "nin", value: ["digital"] }, true],
    [{ field: "name", operator: "exists" }, true],
    [{ field: "missing", operator: "exists" }, false],
    [{ field: "missing.x", operator: "exists" }, false],
    // array (AND)
    [[
      { field: "type", operator: "eq", value: "physical" },
      { field: "price", operator: "gt", value: 100 },
    ], false],
    // conditions + OR
    [{ logic: "OR", conditions: [
      { field: "type", operator: "eq", value: "digital" },
      { field: "price", operator: "gt", value: 10 },
    ] }, true],
    // absent → visible
    [undefined, true],
    [{}, true],
  ])("%o → %s", (rules, want) => {
    expect(evalVisibility(rules, V)).toBe(want);
  });
});
