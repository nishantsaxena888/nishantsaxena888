import { useState, useMemo, useEffect, useRef } from "react";
import { GridIterator } from "./features/grid-iterator";
import { ListIterator } from "./features/list-iterator";
import { TableIterator } from "./features/table-iterator";
import type { IteratorColumn, IteratorConfig } from "./features/type";
import { useIterator } from "./features/use-iterator";
import { useIteratorOptions } from "./features/use-options";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/third-party-shadcn/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/third-party-shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/third-party-shadcn/select";
import { Button } from "@/components/third-party-shadcn/button";
import { Input } from "@/components/third-party-shadcn/input";
import { Checkbox } from "@/components/third-party-shadcn/checkbox";
import {
  Columns3Icon,
  PlusIcon,
  ChevronDownIcon,
  TableIcon,
  LayoutListIcon,
  LayoutGridIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  X,
  GripVerticalIcon,
  Loader2,
  Filter,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/common/lib/utils";
import "./iterator.css";

export const IteratorModule = ({
  data,
  emptyText = "—",
  config,
  type = "table",
  id,
  configuration,
  action,
  onAddRecord,
  createButtonlabel = "Add Record",
  search,
  onSearchChange,
  loading,
  hideViewSwitcher,
  contentClassName,
  styles,
  themeName,
}: IteratorConfig) => {
  const [currentView, setCurrentView] = useState<"table" | "list" | "grid">(
    type as any,
  );
  const [columnSearch, setColumnSearch] = useState("");
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const columns: IteratorColumn[] = useIteratorOptions({ data, config });
  const {
    visibleColumns,
    allColumnsOrdered,
    hiddenKeys,
    toggleColumn,
    reorderColumn,
    showAllColumns,
    hideAllColumns,
  } = useIterator({ data, columns, id });

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== targetKey) {
      reorderColumn(draggedKey, targetKey);
    }
    setDraggedKey(null);
  };

  const [selectedRows, setSelectedRows] = useState<any[]>(
    Array.isArray(configuration?.selectedRow)
      ? configuration.selectedRow
      : configuration?.selectedRow
        ? [configuration.selectedRow]
        : [],
  );

  const filteredDropdownColumns = useMemo(() => {
    if (!columnSearch) return allColumnsOrdered;
    return allColumnsOrdered.filter(
      (c) =>
        c.label.toLowerCase().includes(columnSearch.toLowerCase()) ||
        c.key.toLowerCase().includes(columnSearch.toLowerCase()),
    );
  }, [allColumnsOrdered, columnSearch]);

  const handleSelectedRowChange = (newSelectedRows: any[]) => {
    setSelectedRows(newSelectedRows);
    action?.onSelectedRowChange?.(newSelectedRows);
  };

  const [sortConfig, setSortConfig] = useState<{
    key?: string;
    direction?: "asc" | "desc";
  }>({
    direction: configuration?.sortDirection,
  });

  const activeFilters = useMemo(() => {
    return (config?.filters || []).filter((f: any) => {
      const val = filterValues[f.name];
      return val !== undefined && val !== "" && val !== "all";
    });
  }, [filterValues, config?.filters]);

  const hasActiveFilters = activeFilters.length > 0;

  const lastFiltersRef = useRef<string>(JSON.stringify(filterValues));

  useEffect(() => {
    const currentFiltersStr = JSON.stringify(filterValues);

    // Don't trigger if filters haven't changed
    if (currentFiltersStr === lastFiltersRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastFiltersRef.current = currentFiltersStr;
      action?.onFilter?.(filterValues);
    }, 400);

    return () => clearTimeout(timer);
  }, [filterValues, action]); // Re-arm when the action prop changes too

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    action?.onSort?.(key, direction as any);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <Tabs
        defaultValue={currentView}
        onValueChange={(v) => setCurrentView(v as any)}
        className="w-full flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center">
            {!hideViewSwitcher && (
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="table" className="gap-2">
                  <TableIcon className="size-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <LayoutListIcon className="size-3.5" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2">
                  <LayoutGridIcon className="size-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
              </TabsList>
            )}
            {onSearchChange && (
              <div className={cn("relative w-64", !hideViewSwitcher && "ml-4")}>
                {loading ? (
                  <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  placeholder="Search..."
                  value={search || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 bg-background h-9"
                  type="search"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all font-bold"
                onClick={() => setFilterValues({})}
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </Button>
            )}
            {config?.filters && config.filters.length > 0 && (
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-9 gap-2 shadow-xs transition-all",
                  showFilters && "bg-primary/10 text-primary border-primary/20",
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="size-3.5" />
                <span className="hidden md:inline">Filter</span>
              </Button>
            )}
            <DropdownMenu onOpenChange={(open) => !open && setColumnSearch("")}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 ml-auto sm:ml-0 shadow-xs"
                >
                  <Columns3Icon className="size-3.5 text-muted-foreground" />
                  <span className="hidden md:inline">Columns</span>
                  <ChevronDownIcon className="size-3 text-muted-foreground/50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-0 overflow-hidden shadow-xl border-muted-foreground/10"
              >
                <div className="p-3 bg-muted/30 border-b border-muted-foreground/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Configure Columns
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {visibleColumns.length}/{allColumnsOrdered.length}
                    </span>
                  </div>
                  <div
                    className="relative"
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <SearchIcon className="absolute left-2.5 top-2.5 size-3 text-muted-foreground/60" />
                    <Input
                      placeholder="Search and Filter..."
                      className="h-8 pl-8 text-xs bg-background/50 focus-visible:ring-1"
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    {columnSearch && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 size-6 text-muted-foreground hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setColumnSearch("");
                        }}
                      >
                        <XIcon className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-1 flex gap-1 bg-muted/10 border-b border-muted-foreground/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      showAllColumns();
                    }}
                  >
                    <EyeIcon className="size-3" />
                    Show All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-[10px] gap-1.5 hover:bg-destructive/5 hover:text-destructive transition-colors font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      hideAllColumns();
                    }}
                  >
                    <EyeOffIcon className="size-3" />
                    Hide All
                  </Button>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                  {filteredDropdownColumns.length > 0 ? (
                    filteredDropdownColumns.map((column) => (
                      <DropdownMenuItem
                        key={column.key}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-sm cursor-move group select-none transition-all",
                          draggedKey === column.key &&
                            "opacity-30 bg-muted scale-[0.98]",
                          draggedKey &&
                            draggedKey !== column.key &&
                            "hover:bg-primary/5",
                        )}
                        onSelect={(e) => e.preventDefault()}
                        draggable
                        onDragStart={(e) => handleDragStart(e, column.key)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.key)}
                      >
                        <div
                          className="flex items-center gap-3 w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleColumn(column.key);
                          }}
                        >
                          <Checkbox
                            checked={!hiddenKeys.includes(column.key)}
                            className="size-3.5 pointer-events-none"
                            onCheckedChange={() => {}}
                          />
                          <span className="text-xs font-medium flex-1 group-hover:text-primary transition-colors">
                            {column.label}
                          </span>
                          <GripVerticalIcon className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-[11px] text-muted-foreground italic font-medium">
                      No matching columns found
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {onAddRecord && (
              <Button
                onClick={() => onAddRecord()}
                size="sm"
                className="h-9 gap-2 shadow-sm shadow-primary/20"
              >
                <PlusIcon className="size-3.5" />
                <span className="hidden md:inline">{createButtonlabel}</span>
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4 px-1 animate-in fade-in slide-in-from-left-2 duration-300">
            {activeFilters.map((f: any) => (
              <div
                key={f.name}
                className="group flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-bold transition-all"
              >
                <span className="opacity-60 uppercase tracking-tighter">
                  {f.label}:
                </span>
                <span className="text-foreground/80">
                  {filterValues[f.name]}
                </span>
                <button
                  onClick={() =>
                    setFilterValues((prev) => {
                      const next = { ...prev };
                      delete next[f.name];
                      return next;
                    })
                  }
                  className="p-0.5 rounded-md hover:bg-primary/20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showFilters && config?.filters && config.filters.length > 0 && (
          <div
            className={cn(
              "p-2 bg-muted/10 border border-border/90 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300",
              themeName,
            )}
            style={
              {
                "--primary": styles?.primaryColor,
              } as React.CSSProperties
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
              {config.filters.map((filter: any) => (
                <div key={filter.name} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                    {filter.label}
                  </label>
                  {filter.type === "select" ? (
                    <Select
                      value={filterValues[filter.name] || "all"}
                      onValueChange={(val) =>
                        setFilterValues((prev) => ({
                          ...prev,
                          [filter.name]: val,
                        }))
                      }
                    >
                      <SelectTrigger
                        className="h-9 bg-background/50 border-border/50 rounded-xl text-xs font-semibold focus:ring-primary/20 transition-all"
                        style={{
                          height: styles?.fieldHeight,
                          borderRadius: styles?.fieldBorderRadius,
                          fontSize: styles?.fontSize,
                        }}
                      >
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40 shadow-2xl p-1">
                        {filter.options.map((opt: any) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs font-medium rounded-lg py-1.5 transition-colors"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                      <Input
                        value={filterValues[filter.name] || ""}
                        onChange={(e) =>
                          setFilterValues((prev) => ({
                            ...prev,
                            [filter.name]: e.target.value,
                          }))
                        }
                        placeholder={`Search ${filter.label}...`}
                        className="h-9 bg-background/50 border-border/50 rounded-xl text-xs font-semibold focus:ring-primary/20 transition-all"
                        style={{
                          height: styles?.fieldHeight,
                          borderRadius: styles?.fieldBorderRadius,
                          fontSize: styles?.fontSize,
                        }}
                      />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <TabsContent
          value="table"
          className={cn(
            "m-0 border-none p-0 outline-none animate-in fade-in-50 duration-300",
          )}
        >
          <TableIterator
            visibleColumns={visibleColumns}
            selectedRows={selectedRows}
            onSelectedRowChange={handleSelectedRowChange}
            action={action}
            data={sortedData}
            sortConfig={sortConfig}
            onSort={handleSort}
            configuration={configuration}
            emptyText={emptyText}
            id={id}
            className={contentClassName}
          />
        </TabsContent>

        <TabsContent
          value="list"
          className={cn(
            "m-0 border-none p-0 outline-none animate-in fade-in-50 duration-300",
            contentClassName,
          )}
        >
          <ListIterator
            visibleColumns={visibleColumns}
            data={sortedData}
            action={action}
            selectedRows={selectedRows}
            onSelectedRowChange={handleSelectedRowChange}
            configuration={configuration}
            emptyText={emptyText}
          />
        </TabsContent>

        <TabsContent
          value="grid"
          className={cn(
            "m-0 border-none p-0 outline-none animate-in fade-in-50 duration-300",
            contentClassName,
          )}
        >
          <GridIterator
            visibleColumns={visibleColumns}
            data={sortedData}
            action={action}
            selectedRows={selectedRows}
            onSelectedRowChange={handleSelectedRowChange}
            configuration={configuration}
            emptyText={emptyText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
