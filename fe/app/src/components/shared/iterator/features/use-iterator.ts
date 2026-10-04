import { useMemo, useState, useEffect, useCallback } from "react";
import { storage } from "@/platform/storage";

export const useIterator = ({ data, columns, id }: any) => {
  const getStorageKey = useCallback(
    () => (id ? `table-${id}-config` : null),
    [id],
  );

  const [columnConfig, setColumnConfig] = useState(() => {
    const key = getStorageKey();
    let parsed: any = null;
    if (key) {
      const stored = storage.getItem(key);
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch { /* malformed stored column prefs — use defaults */ }
      }
    }
    return {
      order: Array.isArray(parsed?.order) ? parsed.order : columns.map((c: any) => c.key),
      hiddenKeys: Array.isArray(parsed?.hiddenKeys) ? parsed.hiddenKeys : columns.filter((c: any) => c.hide).map((c: any) => c.key),
    };
  });

  useEffect(() => {
    const key = getStorageKey();
    if (key) {
      storage.setItem(key, JSON.stringify(columnConfig));
    }
  }, [columnConfig, getStorageKey]);

  const toggleColumn = (key: string) => {
    setColumnConfig((prev: any) => {
      const isHidden = prev.hiddenKeys.includes(key);
      return {
        ...prev,
        hiddenKeys: isHidden
          ? prev.hiddenKeys.filter((k: string) => k !== key)
          : [...prev.hiddenKeys, key],
      };
    });
  };

  const reorderColumn = (fromKey: string, toKey: string) => {
    setColumnConfig((prev: any) => {
      const order = [...prev.order];
      const fromIndex = order.indexOf(fromKey);
      const toIndex = order.indexOf(toKey);
      if (fromIndex > -1 && toIndex > -1) {
        const [moved] = order.splice(fromIndex, 1);
        order.splice(toIndex, 0, moved);
      }
      return { ...prev, order };
    });
  };

  const visibleColumns = useMemo(() => {
    const cols = [...columns];
    cols.sort((a, b) => {
      let ai = columnConfig.order.indexOf(a.key);
      let bi = columnConfig.order.indexOf(b.key);
      if (ai === -1) ai = 999;
      if (bi === -1) bi = 999;
      return ai - bi;
    });
    return cols.filter((c: any) => !columnConfig.hiddenKeys.includes(c.key));
  }, [columns, columnConfig]);

  const allColumnsOrdered = useMemo(() => {
    const cols = [...columns];
    cols.sort((a, b) => {
      let ai = columnConfig.order.indexOf(a.key);
      let bi = columnConfig.order.indexOf(b.key);
      if (ai === -1) ai = 999;
      if (bi === -1) bi = 999;
      return ai - bi;
    });
    return cols;
  }, [columns, columnConfig.order]);

  const showAllColumns = () => {
    setColumnConfig((prev: any) => ({ ...prev, hiddenKeys: [] }));
  };

  const hideAllColumns = () => {
    setColumnConfig((prev: any) => ({ ...prev, hiddenKeys: columns.map((c: any) => c.key) }));
  };

  return { 
    visibleColumns, 
    allColumnsOrdered, 
    hiddenKeys: columnConfig.hiddenKeys, 
    toggleColumn, 
    reorderColumn,
    showAllColumns,
    hideAllColumns
  };
};
