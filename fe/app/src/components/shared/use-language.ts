import { createContext, useContext } from 'react';

export type LanguageCode = string;

export interface Language {
    code: LanguageCode;
    name: string;
    flag: string;
}

// Fallback before configuration loads — the client's own
// configuration.language[] replaces this once fetched.
export const LANGUAGES: Language[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

export const FLAGS: Record<string, string> = {
    en: "🇺🇸", hi: "🇮🇳", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪",
    ar: "🇸🇦", pt: "🇧🇷", ja: "🇯🇵", zh: "🇨🇳", bn: "🇧🇩",
};

export interface LanguageContextType {
    language: Language;
    languages: Language[];
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    l: (obj: any, field: string) => any;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultLanguageContext: LanguageContextType = {
    language: LANGUAGES[0],
    languages: LANGUAGES,
    setLanguage: () => {},
    t: (key: string) => key,
    l: (obj: any, field: string) => obj?.[field] ?? '',
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    return context || defaultLanguageContext;
};
