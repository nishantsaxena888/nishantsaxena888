// Test stub for "@react-navigation/native" — minimal in-memory nav so
// navigation.native.ts behaves under jsdom: navigate() records the
// resolved screen name, useRoute returns the current route.
const calls: { to: string; opts?: any }[] = [];
let current = { name: "home", params: { slug: "test" } };

export function useNavigation() {
  return {
    navigate: (to: string, opts?: any) => {
      calls.push({ to, opts });
      current = { ...current, name: to };
    },
    replace: (to: string, opts?: any) => calls.push({ to, opts }),
    goBack: () => calls.push({ to: "<back>" }),
  };
}

export function useRoute() {
  return current;
}

export const __navCalls = () => calls;
export const __resetNav = () => {
  calls.length = 0;
  current = { name: "home", params: { slug: "test" } };
};
