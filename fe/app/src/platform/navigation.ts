// Platform navigation — components call useNav() / <Anchor>, never the
// router directly. The web impl binds react-router inside the provider;
// an RN port binds react-navigation with the same surface:
//
//   useNav()        → { navigate, goBack }   (react-router / react-navigation)
//   <Anchor to>     → <Link> / <Pressable onPress>
//
// navigate() outside components goes through the registered fallback so
// non-hook code (thunks, utils) can navigate too once the app registers.
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface Nav {
  navigate: (to: string) => void;
  goBack: () => void;
}

// Hook impl — web delegates to react-router; an RN port supplies its own
// useNav() from platform/navigation.native.ts (metro resolves .native).
export function useNav(): Nav {
  const navigate = useNavigate();
  return {
    navigate: useCallback((to: string) => navigate(to), [navigate]),
    goBack: useCallback(() => navigate(-1), [navigate]),
  };
}

// Non-hook seam — registered once by the app shell (see ApiProvider wiring
// if needed); RN registers its navigationRef.navigate instead.
let imperativeNav: Nav["navigate"] | null = null;
export const registerNavigator = (fn: Nav["navigate"]) => {
  imperativeNav = fn;
};
export const navTo = (to: string) => imperativeNav?.(to);
