import { useState, useCallback } from 'react';
const useAppStore = (selector: (state: any) => any) => selector({ data: { transactions: [] } });

export function useAdmin(propsOnBack?: () => void, controle?: any) {
    const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
    const transactions = useAppStore(state => state.data.transactions || []);

    const onBack = useCallback(() => {
        if (propsOnBack) {
            propsOnBack();
        } else if (controle?.action) {
            controle.action({ type: 'navigate', data: { target: 'dashboard' } });
        }
    }, [propsOnBack, controle]);

    return {
        currentView,
        setCurrentView,
        onBack,
        transactions
    };
}
