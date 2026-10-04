import { apiClient } from "@/engine";
import { useEffect, useState } from "react";
export const useDashboardControl = ({ activePage }: { activePage: any }) => {
  const entity = activePage.entity;
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const loadData = async () => {
    setLoading(true);
    const response = await apiClient(entity, {
      method: "options",
    });
    setData(response);
    setLoading(false);
  };

  useEffect(() => {
    if (entity) {
      loadData();
    }
  }, [entity]);

  return { data, loading };
};
