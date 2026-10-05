// Platform navigation — components call useNav() / <Anchor> / the hooks
// below, never the router directly. The web impl binds react-router; an
// RN port binds react-navigation with the same surface:
//
//   useNav()         → { navigate, goBack }
//   useRouteParams() → route params   (react-router :params / RN route.params)
//   usePath()        → current path   (location.pathname / RN route name)
//   <Anchor to>      → <Link> / <Pressable onPress>
//
// navigate() outside components goes through the registered fallback so
// non-hook code (thunks, utils) can navigate too once the app registers.
import { useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export interface Nav {
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  goBack: () => void;
}

// Hook impl — web delegates to react-router; an RN port supplies its own
// useNav() from platform/navigation.native.ts (metro resolves .native).
export function useNav(): Nav {
  const navigate = useNavigate();
  return {
    navigate: useCallback(
      (to: string, opts?: { replace?: boolean }) => navigate(to, opts),
      [navigate],
    ),
    goBack: useCallback(() => navigate(-1), [navigate]),
  };
}

// Route params (:slug etc). RN port: useRoute().params.
export function useRouteParams<T extends Record<string, string | undefined> =
  Record<string, string | undefined>>(): T {
  return useParams() as T;
}

// Current location path. RN port: current route name via useRoute().
export function usePath(): string {
  return useLocation().pathname;
}

// Query-param reader — returns a getter: useQuery()("cat") → ?cat value.
// RN port reads useRoute().params instead (nav params carry the query).
export function useQuery(): (key: string) => string | null {
  const { search } = useLocation();
  return useCallback(
    (key: string) => new URLSearchParams(search).get(key),
    [search],
  );
}

// Non-hook seam — registered once by the app shell; RN registers its
// navigationRef.navigate instead.
let imperativeNav: Nav["navigate"] | null = null;
export const registerNavigator = (fn: Nav["navigate"]) => {
  imperativeNav = fn;
};
export const navTo = (to: string) => imperativeNav?.(to);
