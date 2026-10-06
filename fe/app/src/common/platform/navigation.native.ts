// Platform navigation — React Native impl (Metro resolves this over
// navigation.ts). Binds react-navigation with the same surface:
//
//   useNav()         → { navigate, goBack }  via useNavigation()
//   useRouteParams() → useRoute().params
//   usePath()        → useRoute().name (the route name IS the path —
//                      keep screen names == web paths, e.g. "cart" ↔ "/cart")
//   navTo()/registerNavigator — imperative seam; app registers
//                      navigationRef.navigate at boot
//
// Path → screen mapping: "/cart" → "cart", "/" → "home". If the app's
// screen names differ, register a mapper once:
//   setPathMapper((p) => myMap[p] ?? p)
import { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

export interface Nav {
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  goBack: () => void;
}

let pathToScreen: (path: string) => string = (p) =>
  p === "/" ? "home" : p.replace(/^\//, "");

export const setPathMapper = (fn: (path: string) => string) => {
  pathToScreen = fn;
};

export function useNav(): Nav {
  const navigation = useNavigation<any>();
  return {
    navigate: useCallback(
      (to: string, opts?: { replace?: boolean }) =>
        opts?.replace
          ? navigation.replace(pathToScreen(to))
          : navigation.navigate(pathToScreen(to)),
      [navigation],
    ),
    goBack: useCallback(() => navigation.goBack(), [navigation]),
  };
}

export function useRouteParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  return (useRoute().params || {}) as T;
}

export function usePath(): string {
  return useRoute().name;
}

// Query-param reader — same contract as web's useQuery(). On RN there is
// no query string; nav params are the carrier. "?cat=x" in a navigate
// path is parsed into params by the path mapper when set, or pass params
// directly: navigate("stays", { cat: "x" }) via useNavigation if needed.
export function useQuery(): (key: string) => string | null {
  const params = useRoute().params as Record<string, unknown> | undefined;
  return useCallback(
    (key: string) => {
      const v = params?.[key];
      return v != null ? String(v) : null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read route.params lazily; the getter itself is stable
    [],
  );
}

// Non-hook seam — identical contract to the web impl; the app registers
// navigationRef.navigate (or an adapter mapping path→screen first).
let imperativeNav: Nav["navigate"] | null = null;
export const registerNavigator = (fn: Nav["navigate"]) => {
  imperativeNav = (to, opts) => fn(pathToScreen(to), opts);
};
export const navTo = (to: string) => imperativeNav?.(to);
