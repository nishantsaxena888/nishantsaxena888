import React, { useEffect } from "react";
import { useNav } from "@/platform/navigation";
import { DashboardRenderer } from "@/components/shared/dashboard-renderer";
import { storage } from "@/platform/storage";

const Protected = ({ config }: { config: any }) => {
  const { navigate } = useNav();
  const token =
    typeof window !== "undefined" ? storage.getItem("token") : null;

  // Auth is config-driven: admin.require_auth=false → public admin (hello).
  const requireAuth = config?.data?.admin?.require_auth !== false;

  useEffect(() => {
    if (requireAuth && !token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate, requireAuth]);

  return <DashboardRenderer config={config} />;
};

export default Protected;
