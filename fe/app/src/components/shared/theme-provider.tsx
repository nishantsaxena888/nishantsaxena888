import { useEffect, useState, useMemo, useCallback } from "react"
import { apiClient } from "@/common/engine/library/api"
import { setActiveClient } from "@/platform/active-client"
import { useConfigStore } from "@/common/store/use-config-store"
import { storage } from "@/platform/storage";
import {
    ThemeProviderContext,
    type Theme,
    type ThemeOption,
} from "./use-theme";

export type { Theme, ThemeOption }

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export function ThemeProvider({
    children,
    defaultTheme,
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    // Theme options come from the backend "configuration" (config-driven,
    // no mocks). Shape: config.data.themes = [{value, label, endpoint, client}]
    const configThemes = useConfigStore((s: any) => s.config?.themes)
    const THEMES: ThemeOption[] = useMemo(
        () => (Array.isArray(configThemes) ? configThemes : []),
        [configThemes],
    )
    // Precedence: user choice (localStorage) > client's first configured
    // theme > defaultTheme prop. RootProvider passes defaultTheme="default"
    // which must not shadow the client's own branded theme (e.g.
    // grocery-light, uday-dark).
    const fallbackTheme =
        THEMES[0]?.value || defaultTheme || "default"

    const [theme, setTheme] = useState<Theme>(() => {
        try {
            if (typeof window !== 'undefined') {
                return (storage.getItem(storageKey) as Theme) || fallbackTheme
            }
            return fallbackTheme
        } catch (e) {
            return fallbackTheme
        }
    })

    // Config can arrive after mount (configuration fetch): adopt the
    // client's first configured theme when the user hasn't picked one —
    // OR when a stored value is no longer offered by this client (e.g.
    // stale "fashion-black" after a config switch). Theme state moves via
    // render-phase adjust; the effect only persists the adopted value.
    const storedTheme =
        typeof window !== "undefined" ? storage.getItem(storageKey) : null
    const firstTheme = THEMES[0]?.value
    const shouldAdopt =
        Boolean(firstTheme) &&
        theme !== firstTheme &&
        !(storedTheme && THEMES.some((t) => t.value === storedTheme))

    const [prevShouldAdopt, setPrevShouldAdopt] = useState(shouldAdopt)
    if (shouldAdopt !== prevShouldAdopt) {
        setPrevShouldAdopt(shouldAdopt)
        if (shouldAdopt && firstTheme) setTheme(firstTheme)
    }

    useEffect(() => {
        if (shouldAdopt && firstTheme && typeof window !== "undefined") {
            storage.setItem(storageKey, firstTheme)
        }
    }, [shouldAdopt, firstTheme, storageKey])

    const [isFetchingStyleConfig, setIsFetchingStyleConfig] = useState(false)

    // Fetch style-config/${theme} dynamically whenever theme changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const fetchThemeStyleConfig = async () => {
            setIsFetchingStyleConfig(true);
            try {
                const foundOption = THEMES.find((t) => t.value === theme);
                const endpoint = foundOption?.endpoint || `style-config/${theme}`;
                const res = await apiClient(endpoint, { method: "get" });
                const stylesObj = res?.data?.styles;

                if (!res?.error && stylesObj && Object.keys(stylesObj).length > 0) {
                    // Apply inline CSS variables to <html> element for instant 100% priority update
                    Object.entries(stylesObj).forEach(([key, val]) => {
                        document.documentElement.style.setProperty(`--${key}`, String(val));
                    });

                    // Keep dynamic style tag updated as well
                    let styleTag = document.getElementById("dynamic-style-config");
                    if (!styleTag) {
                        styleTag = document.createElement("style");
                        styleTag.id = "dynamic-style-config";
                        document.head.appendChild(styleTag);
                    }
                    const cssRules = Object.entries(stylesObj)
                        .map(([key, val]) => `--${key}: ${val};`)
                        .join("\n");
                    styleTag.textContent = `:root {\n${cssRules}\n}`;
                } else {
                    const styleTag = document.getElementById("dynamic-style-config");
                    if (styleTag) styleTag.remove();
                }
            } catch (err) {
                console.warn("Could not fetch style-config for:", theme, err);
                const styleTag = document.getElementById("dynamic-style-config");
                if (styleTag) styleTag.remove();
            } finally {
                setIsFetchingStyleConfig(false);
            }
        };

        fetchThemeStyleConfig();
    }, [theme, THEMES]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const root = window.document.documentElement

        // Remove all dynamic theme classes
        const allDynamicThemes = THEMES.map((t) => `theme-${t.value}`)
        root.classList.remove(...allDynamicThemes, "dark", "light")

        if (theme === "dark") {
            root.classList.add("dark")
        } else if (theme !== "light" && theme !== "default") {
            root.classList.add(`theme-${theme}`)
        }
    }, [theme, THEMES])

    const handleSetTheme = useCallback((newTheme: Theme, clientOverride?: string) => {
        try {
            if (typeof window !== 'undefined') {
                storage.setItem(storageKey, newTheme)
            }
        } catch { /* storage unavailable */ }

        const foundOption = THEMES.find((t) => t.value === newTheme);
        const targetClient = clientOverride || foundOption?.client;
        if (targetClient) {
            setActiveClient(targetClient);
        }

        setTheme(newTheme)
    }, [storageKey, THEMES]);

    const value = useMemo(() => ({
        theme,
        setTheme: handleSetTheme,
        themes: THEMES,
        isFetchingStyleConfig,
    }), [theme, handleSetTheme, THEMES, isFetchingStyleConfig]);

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
