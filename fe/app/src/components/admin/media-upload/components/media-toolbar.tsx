import React from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/third-party-shadcn/button";
import { Input } from "@/components/third-party-shadcn/input";

interface MediaToolbarProps {
  filterType: string;
  setFilterType: (val: string) => void;
  filterDate: string;
  setFilterDate: (val: string) => void;
  isBulkMode: boolean;
  setIsBulkMode: (val: boolean) => void;
  setSelectedIds: (val: number[]) => void;
  searchValue: string;
  searchLoading: boolean;
  onChangeHandle: (val: any) => void;
  allowedType?: "image" | "all";
  multiple?: boolean;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  filterType,
  setFilterType,
  filterDate,
  setFilterDate,
  isBulkMode,
  setIsBulkMode,
  setSelectedIds,
  searchValue,
  searchLoading,
  onChangeHandle,
  allowedType,
  multiple,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/10 p-3 rounded-lg border border-border/40">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Media Types Filter */}
        {allowedType === "image" ? (
          <select
            value="image"
            disabled
            className="bg-background border rounded px-3 py-1.5 text-sm outline-none cursor-not-allowed opacity-75"
          >
            <option value="image">Images only</option>
          </select>
        ) : (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border rounded px-3 py-1.5 text-sm outline-none cursor-pointer focus:ring-1 focus:ring-ring"
          >
            <option value="all">All media items</option>
            <option value="image">Images</option>
            <option value="pdf">PDF Documents</option>
            <option value="docx">Word Documents</option>
            <option value="xlsx">Spreadsheets</option>
          </select>
        )}

        {/* Date Filter */}
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-background border rounded px-3 py-1.5 text-sm outline-none cursor-pointer focus:ring-1 focus:ring-ring"
        >
          <option value="all">All dates</option>
          <option value="may-2026">May 2026</option>
        </select>

        {multiple !== false && (
          <Button
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              setSelectedIds([]);
            }}
            variant={isBulkMode ? "default" : "outline"}
            size="sm"
            className="h-9 font-semibold"
          >
            {isBulkMode ? "Cancel Select" : "Bulk Select"}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full md:w-72">
        {searchLoading ? (
          <Loader2 className="absolute left-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Search media..."
          value={searchValue}
          onChange={(e) => onChangeHandle({ type: "search", value: e.target.value })}
          className="pl-9 h-9 bg-background focus-visible:ring-1"
        />
      </div>
    </div>
  );
};
