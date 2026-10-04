import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useConfigStore } from "@/store/use-config-store";
import { storage } from "@/platform/storage";

export const useAdmin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const config = useConfigStore((state) => state.config);

  const logout = useCallback(() => {
    storage.removeItem("token");
    setUser(null);
    setLoading(false);
    // Role is back to the default — re-filter menus.
    window.dispatchEvent(new Event("auth-change"));

    // Dynamic redirect from config
    const redirectPath = config?.admin?.logout_redirect || "/login";
    navigate(redirectPath, { replace: true });
  }, [navigate, config]);

  useEffect(() => {
    const token = storage.getItem("token");
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // Basic expiration check
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          console.warn("Session expired");
          logout();
          return;
        }

        setUser(decoded);
      } catch (error) {
        console.error("Token decoding failed:", error);
        logout();
      }
    }
    
    setLoading(false);
  }, [logout]);

  return {
    user,
    logout,
    loading,
    isAuthenticated: !!user,
    token: typeof window !== "undefined" ? storage.getItem("token") : null,
  };
};
