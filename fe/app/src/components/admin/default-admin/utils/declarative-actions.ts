// Declarative table actions — OPTIONS content.table declares them, the
// generic grid executes them. No per-client code.
//
//   table.row_actions:  [{name, label, icon, type, endpoint, method,
//                         payload, confirm, navigation}]
//   table.bulk_actions: same shape, run once per selected row
//   table.export: true → built-in "Export CSV" of the current rows
//
// Action shapes:
//   type "api"      (default) — apiClient(interpolate(endpoint,row),
//                                {method: def.method || "post", payload})
//                                "{field}" placeholders come from the row
//   type "navigate" — navigate(interpolate(def.navigation,row))
//   name "bulk_delete" (builtin) — DELETE <entity>/<id> per selected row
//   name "export_csv"  (builtin) — CSV download, no API call
//   confirm: string | {title, description} — gates execution
import { apiClient } from "@/common/engine";

export const interpolate = (tpl: string | undefined, row: any): string =>
  String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => row?.[k] ?? "");

export function exportCsv(
  filename: string,
  rows: any[],
  columns: Array<{ key: string; label?: string }>,
): void {
  const cols: Array<{ key: string; label?: string }> = columns.length
    ? columns
    : rows[0]
      ? Object.keys(rows[0]).map((k) => ({ key: k }))
      : [];
  const esc = (v: any) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    cols.map((c) => esc(c.label || c.key)).join(","),
    ...rows.map((r) => cols.map((c) => esc(r?.[c.key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function runDeclarativeAction(
  def: any,
  row: any,
  ctx: {
    entity?: string;
    navigate: (url: string) => void;
  },
): Promise<{ ok: boolean; response?: any }> {
  if (def.name === "export_csv") return { ok: true }; // handled by caller
  if (def.type === "navigate") {
    ctx.navigate(interpolate(def.navigation, row));
    return { ok: true };
  }
  const endpoint = interpolate(def.endpoint, row) ||
    (ctx.entity ? `${ctx.entity}/${interpolate(def.id_path ?? "{id}", row)}` : "");
  const response = await apiClient(endpoint, {
    method: def.method || "post",
    payload: def.payload
      ? JSON.parse(interpolate(JSON.stringify(def.payload), row))
      : undefined,
  });
  return { ok: !response.error, response };
}
