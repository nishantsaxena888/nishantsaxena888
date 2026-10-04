import { apiClient } from "@/engine";
import { useEffect, useState } from "react";
export const useDashboardControl = ({ activePage }: { activePage: any }) => {
  const entity = activePage.entity;
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  // Entity switched → reset immediately (render-phase adjust), then the
  // effect below fetches async — no synchronous setState inside effects.
  const [prevEntity, setPrevEntity] = useState(entity);
  if (entity !== prevEntity) {
    setPrevEntity(entity);
    setData(undefined);
    setLoading(true);
  }

  useEffect(() => {
    if (!entity) return;
    let cancelled = false;
    apiClient(entity, { method: "options" })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entity]);

  return { data, loading };
};
