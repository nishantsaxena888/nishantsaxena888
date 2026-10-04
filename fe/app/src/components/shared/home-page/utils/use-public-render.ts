import { apiClient } from "@/engine";
import { useEffect, useState } from "react";
import { useRouteParams } from "@/platform/navigation";

export const usePublicRender = ({ menu, currentPage }: any) => {
  const param = useRouteParams();
  const currentMenu = Array.isArray(menu) ? menu.find((item: any) => item.url === currentPage) : undefined;

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
