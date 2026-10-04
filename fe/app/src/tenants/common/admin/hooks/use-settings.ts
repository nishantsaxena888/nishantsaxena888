import { useState } from 'react';


export function useSettings(content: any) {
    const [activeTab, setActiveTab] = useState('general');

    const storeName = content?.storeName || "Inventure POS";
    const defaultCurrency = content?.defaultCurrency || "USD";
    const fastMode = content?.fastMode ?? false;
    const glassmorphism = content?.glassmorphism ?? true;

    return {
        activeTab,
        setActiveTab,
        storeName,
        defaultCurrency,
        fastMode,
        glassmorphism
    };
}
