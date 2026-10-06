import type { IteratorColumn } from "../type";
import { defaultFormat, getByPath, formatCellValue } from "../utils";
import { Anchor } from "@/platform/primitives";
import { TableHeader as IteratorTableHeader } from "./table-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/third-party-shadcn/table";
import { Checkbox } from "@/components/third-party-shadcn/checkbox";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Icon, type IconName } from "@/components/third-party-shadcn/icon-picker";
import { Button } from "@/components/third-party-shadcn/button";

export const TableIterator = ({
  visibleColumns,
  selectedRows = [],
  onSelectedRowChange,
  action,
  data,
  sortConfig,
  onSort,
  configuration,
  emptyText,
  id,
  className,
}: {
  visibleColumns: IteratorColumn[];
  selectedRows?: any[];
  onSelectedRowChange?: (selectedRows: any[]) => void;
  action?: any;
  data: any[];
  sortConfig?: { key?: string; direction?: "asc" | "desc" };
  onSort?: (key: string) => void;
  configuration?: any;
  emptyText: string;
  id?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background shadow-sm",
        className,
      )}
    >
      <Table
        className={cn("w-full transition-all", configuration?.tableClassName)}
      >
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[60px]">
              <div className="flex items-center justify-start">
                <Checkbox
                  checked={
                    data.length > 0 && selectedRows.length === data.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) onSelectedRowChange?.([...data]);
                    else onSelectedRowChange?.([]);
                  }}
                  aria-label="Select all"
                />
              </div>
            </TableHead>
            {visibleColumns.map((column: any, index: number) => {
              return (
                <IteratorTableHeader
                  data={column}
                  key={index}
                  tableId={id}
                  sortConfig={sortConfig}
                  onSort={onSort}
                />
              );
            })}
            {!!(action?.onEdit || action?.onDelete || action?.customActions?.length) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row: any, rowIndex: any) => {
              const rowId = row.id !== undefined ? row.id : rowIndex;
              const isSelected = selectedRows.some(
                (r) => (r.id !== undefined ? r.id : r) === rowId || r === row,
              );
              const rowClass =
                typeof configuration?.rowClassName === "function"
                  ? configuration.rowClassName(row, rowIndex)
                  : configuration?.rowClassName;

              return (
                <TableRow
                  key={rowId}
                  className={cn(
                    "cursor-default transition-colors group",
                    isSelected && "bg-muted/50",
                    action?.onRowClick && "cursor-pointer",
                    rowClass,
                  )}
                  onClick={() => action?.onRowClick?.(row)}
                >
                  <TableCell>
                    <div className="flex items-center justify-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSelectedRowChange?.([...selectedRows, row]);
                          } else {
                            onSelectedRowChange?.(
                              selectedRows.filter(
                                (r) =>
                                  (r.id !== undefined ? r.id : r) !== rowId &&
                                  r !== row,
                              ),
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Select row"
                      />
                      <span className="text-[10px] font-medium text-muted-foreground/50 w-4 group-hover:text-muted-foreground transition-colors">
                        {rowIndex + 1}
                      </span>
                    </div>
                  </TableCell>
                  {visibleColumns.map((column: any, index: number) => {
                    // Nested path keys ("customer.name") read via getByPath —
                    // relation columns declared in OPTIONS.
                    const value = column.key?.includes(".")
                      ? getByPath(row, column.key)
                      : row[column.key];
                    // Declared `format` wins over the generic render — it's
                    // the JSON-serializable way to say "money/link/badge".
                    const hasFormat =
                      typeof column.format === "string" &&
                      column.format !== "text";
                    let content: any = hasFormat
                      ? formatCellValue(value, column, emptyText)
                      : column.render
                        ? column.render(value, row, rowIndex, emptyText)
                        : defaultFormat(value, emptyText);
                    // React-valued declarative formats — OPTIONS JSON can't
                    // carry render functions, so `format` names a renderer.
                    if (column.format === "link" && value !== null && value !== undefined) {
                      const to = (column.link || "/{id}").replace(
                        /\{(\w+)\}/g,
                        (_: string, k: string) => encodeURIComponent(getByPath(row, k) ?? ""),
                      );
                      content = (
                        <Anchor to={to} className="text-primary underline-offset-2 hover:underline">
                          {defaultFormat(value, emptyText)}
                        </Anchor>
                      );
                    } else if (column.format === "badge" && value !== null && value !== undefined) {
                      const variant = column.badge_map?.[String(value)] || "secondary";
                      content = (
                        <span className={`badge badge-${variant} inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`}>
                          {defaultFormat(value, emptyText)}
                        </span>
                      );
                    } else if (column.format === "image" && value) {
                      content = (
                        <img src={value} alt={column.label || ""} className="h-8 w-8 rounded object-cover" />
                      );
                    }
                    const cellClass =
                      typeof configuration?.cellClassName === "function"
                        ? configuration.cellClassName(value, row, column)
                        : configuration?.cellClassName;

                    return (
                      <TableCell
                        key={index}
                        className={cn(
                          "max-w-[300px] truncate text-sm text-foreground/80 group-hover:text-foreground transition-colors",
                          cellClass,
                        )}
                      >
                        {content}
                      </TableCell>
                    );
                  })}
                  {!!(action?.onEdit || action?.onDelete || action?.customActions?.length) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {action?.onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onEdit(row);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {action?.customActions?.map((def: any) => (
                          <Button
                            key={def.name}
                            variant="ghost"
                            size={def.icon ? "icon" : "sm"}
                            title={def.label || def.name}
                            className="h-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onCustomAction?.(row, def);
                            }}
                          >
                            {def.icon ? (
                              <Icon name={def.icon as IconName} className="h-3.5 w-3.5" />
                            ) : (
                              <span className="text-xs px-1">{def.label || def.name}</span>
                            )}
                          </Button>
                        ))}
                        {action?.onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onDelete(row);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  visibleColumns.length +
                  (action?.onEdit || action?.onDelete || action?.customActions?.length
                    ? 2
                    : 1)
                }
                className="h-24 text-center text-muted-foreground"
              >
                {emptyText || "No results found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
