export function to12Hour(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) throw new Error("Invalid time, expected HH:mm or HH:mm:ss");

  let [_, hh, mm, ss] = m;
  let h = Number(hh);
  if (h > 23 || Number(mm) > 59 || (ss && Number(ss) > 59)) {
    throw new Error("Out-of-range time");
  }

  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm}${ss ? `:${ss}` : ""} ${period}`;
}

export function isPrimitive(v: unknown) {
  return (
    v === null ||
    v === undefined ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    typeof v === "bigint" ||
    typeof v === "symbol"
  );
}

export function defaultFormat(value: any, emptyText = "—"): string {
  if (value === null || value === undefined) return emptyText;
  if (isPrimitive(value))
    return typeof value === "symbol" ? value.toString() : String(value);
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value))
    return value.every(isPrimitive) ? value.join(", ") : JSON.stringify(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function toNumberForSum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]+/g, ""));
    return isNaN(n) ? NaN : n;
  }
  return NaN;
}

export function textAlignClass(a?: "left" | "center" | "right") {
  return a === "right"
    ? "text-right"
    : a === "center"
    ? "text-center"
    : "text-left";
}

export function flexJustifyClass(a?: "left" | "center" | "right") {
  return a === "right"
    ? "justify-end"
    : a === "center"
    ? "justify-center"
    : "justify-start";
}
