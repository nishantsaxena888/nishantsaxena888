import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConfigStore } from "@/common/store/use-config-store";
import { storage } from "@/platform/storage";
import { reloadApp } from "@/platform/host";
import {
    FLAGS,
    LANGUAGES,
    LanguageContext,
    type Language,
    type LanguageCode,
} from "./use-language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Config-driven languages — configuration.language[] supplies
    // {name, code, flag?}; falls back to en/hi until config arrives.
    const configLangs = useConfigStore((s: any) => s.config?.language);
    const languages: Language[] = useMemo(() => {
        const list = Array.isArray(configLangs) && configLangs.length
            ? configLangs
            : LANGUAGES;
        return list.map((l: any) => ({
            code: l.code,
            name: l.name,
            flag: l.flag || FLAGS[l.code] || "🌐",
        }));
    }, [configLangs]);

    const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    // Adopt the saved code when valid, otherwise the client's first
    // configured language once the list resolves — render-phase adjust.
    const [prevLanguages, setPrevLanguages] = useState(languages);
    if (languages !== prevLanguages) {
        setPrevLanguages(languages);
        const savedCode = typeof window !== 'undefined'
            ? (storage.getItem('language') as LanguageCode)
            : null;
        const found = languages.find(l => l.code === savedCode);
        setCurrentLanguage(prev =>
            found ? found : languages.find(l => l.code === prev.code) || languages[0]
        );
    }

    // Load translations from the real API when language changes
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const { apiClient } = await import("@/common/engine/library/api");
                const res = await apiClient("translations", { method: "get" });
                setTranslations(res?.error ? {} : (res?.data || {}));
            } catch (err) {
                setTranslations({});
            }
        };
        loadTranslations();
    }, [currentLanguage.code]);

    const handleSetLanguage = useCallback((lang: Language) => {
        setCurrentLanguage(lang);
        if (typeof window !== 'undefined') {
            storage.setItem('language', lang.code);
            reloadApp();
        }
    }, []);

    const t = useCallback((key: string): string => {
        return translations[key] || key;
    }, [translations]);

    /** Helper to get localized value from an object with optional translations field */
    const l = useCallback((obj: any, field: string): any => {
        if (!obj) return '';

        // Handle nested paths like 'hero.headline'
        const parts = field.split('.');

        const getNestedValue = (target: any, path: string[]) => {
            return path.reduce((acc, part) => acc?.[part], target);
        };

        // 1. Try to get localized value
        const localized = obj.translations?.[currentLanguage.code];
        const localizedValue = localized ? getNestedValue(localized, parts) : undefined;

        if (localizedValue !== undefined) return localizedValue;

        // 2. Fallback to default value (English)
        const defaultValue = getNestedValue(obj, parts);

        return defaultValue ?? '';
    }, [currentLanguage.code]);

    const value = useMemo(() => ({
        language: currentLanguage,
        languages,
        setLanguage: handleSetLanguage,
        t,
        l,
    }), [currentLanguage, languages, handleSetLanguage, t, l]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
