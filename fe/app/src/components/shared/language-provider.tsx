import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type LanguageCode = string;

export interface Language {
    code: LanguageCode;
    name: string;
    flag: string;
}

const LANGUAGES: Language[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

// Export so components can import from here
export { LANGUAGES };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    l: (obj: any, field: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCode = localStorage.getItem('language') as LanguageCode;
            const found = LANGUAGES.find(l => l.code === savedCode);
            if (found) setCurrentLanguage(found);
        }
    }, []);

    // Load translations from the real API when language changes
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const { apiClient } = await import("@/engine/library/api");
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
            localStorage.setItem('language', lang.code);
            window.location.reload();
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
        setLanguage: handleSetLanguage,
        t,
        l,
    }), [currentLanguage, handleSetLanguage, t, l]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

const defaultLanguageContext: LanguageContextType = {
    language: LANGUAGES[0],
    setLanguage: () => {},
    t: (key: string) => key,
    l: (obj: any, field: string) => obj?.[field] ?? '',
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    return context || defaultLanguageContext;
};
