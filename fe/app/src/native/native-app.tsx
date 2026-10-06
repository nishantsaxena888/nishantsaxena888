// React Native app shell — the native twin of main.tsx + create-router.
// Same provider stack minus the web router; react-navigation drives
// screens instead. Every config menu entry becomes a Stack.Screen —
// PublicRenderer is reused unchanged because initialParams.slug lands in
// useRouteParams() on native exactly like react-router's :slug.
//
//   const navRef = useNavigationContainerRef();
//   <NavigationContainer ref={navRef} onReady={register imperative nav}>
//     <Stack.Navigator>
//       home screen  → <Home/>       (menu "/" or first item)
//       each menu item → <PublicRenderer/> (initialParams.slug = path)
//     </Stack.Navigator>
//   </NavigationContainer>
//
// Boot contract (the host app's index file calls these, in order):
//   setEnvConfig({apiUrl, client, dev: __DEV__});
//   await hydrateStorage();
//   render <NativeApp/>
//
// Admin stays on web/desktop — the admin surface is DOM-oriented; a
// native admin shell can come later behind the same seams.
import React, { useEffect, useMemo, useState } from "react";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LanguageProvider } from "@/components/shared/language-provider";
import ApiProvider from "@/components/shared/api-provider";
import AppProvider from "@/components/shared/app-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PublicRenderer } from "@/components/site/public-renderer";
import { Home } from "@/pages/home/home";
import { componentsMap } from "@/tenants";
import { formInput } from "@/components/shared/form-input/form-input";
import { hydrateStorage } from "@/platform/storage";
import { registerNavigator } from "@/platform/navigation";

const Stack = createNativeStackNavigator();

const ScreenBody = ({ data }: { data: any }) => (
  <PublicRenderer config={data} />
);

const AppScreens = ({ data }: { data: any }) => {
  const screens = useMemo(() => {
    const menu = Array.isArray(data?.data?.menu) ? data.data.menu : [];
    return menu
      .map((item: any) =>
        String(item?.url || item?.entity || "")
          .replace(/^\/+|\/+$/g, ""),
      )
      .filter(Boolean);
  }, [data]);

  return (
    <Stack.Navigator>
      <Stack.Screen name="home" options={{ title: data?.meta?.app_name || "" }}>
        {() => <Home config={data} />}
      </Stack.Screen>
      {screens.map((slug: string) => (
        // initialParams puts {slug} into useRouteParams() — the same slot
        // react-router's /:slug fills on web.
        <Stack.Screen key={slug} name={slug} initialParams={{ slug }}>
          {() => <ScreenBody data={data} />}
        </Stack.Screen>
      ))}
    </Stack.Navigator>
  );
};

export default function NativeApp() {
  const [ready, setReady] = useState(false);
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    hydrateStorage().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <LanguageProvider>
      <ApiProvider componentMap={componentsMap} formInput={formInput}>
        <AppProvider>
          {(data: any) => (
            <ThemeProvider defaultTheme="default">
              <NavigationContainer
                ref={navRef}
                onReady={() =>
                  // Imperative seam for non-hook callers (navTo).
                  registerNavigator((screen: string, opts?: any) =>
                    opts?.replace
                      ? navRef.replace?.(screen) ?? navRef.navigate(screen)
                      : navRef.navigate(screen),
                  )
                }
              >
                <AppScreens data={data} />
              </NavigationContainer>
            </ThemeProvider>
          )}
        </AppProvider>
      </ApiProvider>
    </LanguageProvider>
  );
}
