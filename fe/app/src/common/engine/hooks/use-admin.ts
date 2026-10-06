import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNav } from "@/platform/navigation";
import { emitAppEvent } from "@/platform/host";
import { useConfigStore } from "@/common/store/use-config-store";
import { storage } from "@/platform/storage";

export const useAdmin = () => {
  // Decode the token synchronously at init — no mount-effect setState.
  const [user, setUser] = useState<any>(() => {
    const token = storage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp && decoded.exp < Date.now() / 1000) return null;
      return decoded;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const { navigate } = useNav();
  const config = useConfigStore((state) => state.config);

  const logout = useCallback(() => {
    storage.removeItem("token");
    setUser(null);
    setLoading(false);
    // Role is back to the default — re-filter menus.
    emitAppEvent("auth-change");

    // Dynamic redirect from config
    const redirectPath = config?.admin?.logout_redirect || "/login";
    navigate(redirectPath, { replace: true });
  }, [navigate, config]);

  // Expired/undecodable token → logout side effects only; user state was
  // already resolved in the initializer above.
  useEffect(() => {
    const token = storage.getItem("token");
    if (!token) return;
    let expired = false;
    try {
      const decoded = jwtDecode(token);
      expired = !!(decoded.exp && decoded.exp < Date.now() / 1000);
    } catch {
      expired = true;
    }
    if (expired) queueMicrotask(logout);
  }, [logout]);

  return {
    user,
    logout,
    loading,
    isAuthenticated: !!user,
    token: typeof window !== "undefined" ? storage.getItem("token") : null,
  };
};
