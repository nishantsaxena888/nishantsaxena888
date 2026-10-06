import React, { useState, useRef, useCallback, useEffect } from "react";
import { TableHead } from "@/components/third-party-shadcn/table";
import { cn } from "@/common/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { storage } from "@/platform/storage";

export const TableHeader = ({ data, tableId, sortConfig, onSort }: { data: any, tableId?: string, sortConfig?: { key?: string, direction?: "asc" | "desc" }, onSort?: (key: string) => void }) => {
  const columnKey = data.key;
  const storageKey = tableId && columnKey ? `table-${tableId}-col-${columnKey}-width` : null;

  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const stored = storage.getItem(storageKey);
      if (stored && !isNaN(Number(stored))) {
        return Number(stored);
      }
    }
    return data.width || 150;
  });

  const isResizing = useRef(false);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const dragCleanup = useRef<AbortController | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    // Both listeners auto-remove when the drag ends (mouseup → abort).
    const ac = new AbortController();
    dragCleanup.current = ac;
    document.addEventListener(
      "mousemove",
      (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = startWidth.current + (ev.clientX - startX.current);
        setWidth(Math.max(50, newWidth));
      },
      { signal: ac.signal },
    );
    document.addEventListener(
      "mouseup",
      () => {
        isResizing.current = false;
        document.body.style.cursor = "default";
        ac.abort();
      },
      { signal: ac.signal },
    );
    document.body.style.cursor = "col-resize";
  };

  useEffect(() => {
    if (storageKey) {
      storage.setItem(storageKey, String(width));
    }
  }, [width, storageKey]);

  return (
    <th
      style={{
        width: `${width}px`,
        position: "relative",
        minWidth: "30px",
        borderBottom: "1px solid #ddd",
        padding: "8px",
        textAlign: "left",
      }}
    >
      <div 
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: data.sortable ? "pointer" : "default" }}
        onClick={() => { if (data.sortable && onSort) onSort(data.key); }}
      >
        <span>{data.label}</span>
        {data.sortable && (
          <span style={{ fontSize: "12px", marginLeft: "4px", opacity: sortConfig?.key === data.key ? 1 : 0.3 }}>
            {sortConfig?.key === data.key ? (sortConfig?.direction === "asc" ? "▲" : "▼") : "↕"}
          </span>
        )}
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "col-resize",
          zIndex: 10,
        }}
      />
    </th>
  );
};
