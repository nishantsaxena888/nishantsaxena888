// Iterator cell contract — nested-path keys + declarative formats.
// These are the JSON-serializable capabilities OPTIONS can declare.
import { describe, expect, it } from "vitest";
import { getByPath, formatCellValue } from "./utils";

describe("getByPath (relation columns)", () => {
  it.each([
    [{ customer: { name: "Nish" } }, "customer.name", "Nish"],
    [{ customer: { name: "Nish" } }, "customer.missing", undefined],
    [{ a: { b: { c: 3 } } }, "a.b.c", 3],
    [{ name: "x" }, "name", "x"],
    [{}, "a.b.c", undefined],
    [null, "a.b", undefined],
  ])("(%o).%s → %s", (row, path, want) => {
    expect(getByPath(row, path)).toBe(want);
  });
});

describe("formatCellValue (declarative column.format)", () => {
  it.each([
    [12.5, { format: "money" }, "$12.50"],
    ["9", { format: "money", currency: "₹" }, "₹9.00"],
    ["abc", { format: "money" }, "—"],
    ["2024-01-15", { format: "date" }, new Date("2024-01-15").toLocaleDateString()],
    [true, { format: "boolean" }, "Yes"],
    [false, { format: "boolean" }, "No"],
    [null, { format: "boolean" }, "—"],
    [42, { format: "percent" }, "42%"],
    [{ a: 1 }, { format: "json" }, '{"a":1}'],
    ["raw", {}, "raw"],
    [null, {}, "—"],
  ])("%o + %o → %s", (value, column, want) => {
    expect(formatCellValue(value, column)).toBe(want);
  });
});
