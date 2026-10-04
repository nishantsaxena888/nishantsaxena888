import { apiClient } from "@/engine";
import { useEffect, useState } from "react";
import { useRouteParams } from "@/platform/navigation";

export const usePublicRender = ({ menu, currentPage }: any) => {
  const param = useRouteParams();
  const currentMenu = Array.isArray(menu) ? menu.find((item: any) => item.url === currentPage) : undefined;

  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentMenu?.entity) {
        const response = await apiClient(currentMenu?.entity, {
          method: "get",
        });
        setData(response);
      }
    } catch (err) {
      console.error("Failed to fetch entity content:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentMenu?.entity) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentMenu]);

  return { data, loading };
};
