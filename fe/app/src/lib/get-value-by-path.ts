/**
 * Resolves a value from a nested object using a dot-separated path.
 * Also supports bracket notation for array indices: "items[0].name"
 *
 * @example
 *   getValueByPath({ a: { b: 42 } }, "a.b")          // 42
 *   getValueByPath({ x: [10, 20] }, "x[1]")           // 20
 *   getValueByPath({ x: 1 }, "y.z", "default")        // "default"
 */
export function getValueByPath(obj: any, path: string, fallback: any = undefined): any {
  if (!obj || !path) return fallback;

  const keys = path
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/^\./, "")
    .split(".");

  let current = obj;
  for (const key of keys) {
    if (current == null) return fallback;
    const resolved = !isNaN(Number(key)) ? Number(key) : key;
    current = current[resolved];
  }
  return current !== undefined ? current : fallback;
}
