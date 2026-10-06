import { apiClient } from "@/engine";
import { useEffect, useState } from "react";

// Match a menu entry against a concrete path. Plain urls compare
// exactly; parameterized urls (/stays/:id) match per-segment so the
// same page def serves /stays/5, /stays/9, ... Entries without a url
// fall back to entity === first path segment (legacy behavior).
export const matchMenuEntry = (menu: any[], path: string) => {
  if (!Array.isArray(menu)) return undefined;
  const firstSeg = path.replace(/^\/+|\/+$/g, "").split("/")[0];
  return menu.find((item: any) => {
    const url: string | undefined = item.url;
    if (url) {
      if (url === path) return true;
      if (url.includes(":")) {
        const rx = new RegExp(
          "^" + url.replace(/:[^/]+/g, "[^/]+") + "$",
        );
        if (rx.test(path)) return true;
      }
    }
    return item.entity === path.replace(/^\/+|\/+$/g, "") ||
      item.entity === firstSeg;
  });
};

export const usePublicRender = ({ menu, currentPage }: any) => {
  const currentMenu = matchMenuEntry(menu, currentPage);

  const [data, setData] = useState<any>(undefined);
  // No entity → nothing to fetch → not loading (matches the old
  // effect's `else setLoading(false)`).
  const [loading, setLoading] = useState(() =>
    Boolean(currentMenu?.entity),
  );

  // Menu/page switched → reset immediately (render-phase adjust); the
  // effect below only does async work.
  const [prevMenu, setPrevMenu] = useState(currentMenu);
  if (currentMenu !== prevMenu) {
    setPrevMenu(currentMenu);
    setData(undefined);
    setLoading(Boolean(currentMenu?.entity));
  }

  useEffect(() => {
    const entity = currentMenu?.entity;
    if (!entity) return;
    let cancelled = false;
    apiClient(entity, { method: "get" })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch entity content:", err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentMenu]);

  return { data, loading };
};
