import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Globe,
    Bell,
    Shield,
    Database,
    Palette,
    Layout,
    Save,
    DollarSign,
    Zap,
    HardDrive
} from 'lucide-react';
import { useEngine } from '../../../engine/contexts/EngineContext';

import { useSettings } from './hooks/use-settings';

export function SettingsPage(props: any) {
    const { content } = props;
    const { t, currentLanguage } = useEngine();
    const {
        activeTab,
        setActiveTab,
        storeName,
        defaultCurrency,
        fastMode,
        glassmorphism
    } = useSettings(content);

    const SettingItem = ({ icon: Icon, title, desc, children }: { icon: any, title: string, desc: string, children: React.ReactNode }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 bg-card/50 hover:bg-card hover:border-primary/30 transition-all gap-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black text-sm tracking-tight">{title}</h4>
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">{desc}</p>
                </div>
            </div>
            <div className="shrink-0 flex items-center">
                {children}
            </div>
        </div>
    );

    const menuItems = [
        { id: 'general', icon: Globe, label: t('General', currentLanguage.code, 'ui') },
        { id: 'appearance', icon: Palette, label: t('Appearance', currentLanguage.code, 'ui') },
        { id: 'notifications', icon: Bell, label: t('Notifications', currentLanguage.code, 'ui') },
        { id: 'security', icon: Shield, label: t('Security', currentLanguage.code, 'ui') },
        { id: 'data', icon: Database, label: t('Data & Backup', currentLanguage.code, 'ui') },
    ];

    return (
        <div key={currentLanguage.code} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">{t('System Settings', currentLanguage.code, 'ui')}</h1>
                        <p className="text-muted-foreground font-medium">{t('Configure your global store preferences and system behavior.', currentLanguage.code, 'ui')}</p>
                    </div>
                </div>
                <Button className="h-12 px-6 rounded-xl font-black shadow-xl shadow-primary/20 gap-2 hidden sm:flex">
                    <Save className="w-4 h-4" /> {t('Save All Changes', currentLanguage.code, 'ui')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="md:col-span-3 space-y-2">
                    {menuItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={activeTab === item.id ? 'secondary' : 'ghost'}
                            className={`w-full justify-start h-12 rounded-xl font-bold gap-3 ${activeTab === item.id ? 'text-primary' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Button>
                    ))}

                    <div className="pt-8 px-4">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest">{t('Storage Status', currentLanguage.code, 'ui')}</p>
                            <div className="h-1.5 bg-muted rounded-full">
                                <div className="h-full bg-primary w-[45%]"></div>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground">{t('4.5GB of 10GB used', currentLanguage.code, 'ui')}</p>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="md:col-span-9 space-y-8">
                    {activeTab === 'general' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="rounded-md font-black text-[10px]">{t('LIVE', currentLanguage.code, 'ui')}</Badge>
                                <h3 className="text-lg font-black tracking-tight">{t('General Configuration', currentLanguage.code, 'ui')}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <SettingItem
                                    icon={Globe}
                                    title={t('Store Name', currentLanguage.code, 'ui')}
                                    desc={t('This will appear on receipts and terminal headers.', currentLanguage.code, 'ui')}
                                >
                                    <Input defaultValue={storeName} className="w-[200px] h-10 rounded-xl border-2 font-bold" />
                                </SettingItem>

                                <SettingItem
                                    icon={DollarSign}
                                    title={t('Default Currency', currentLanguage.code, 'ui')}
                                    desc={t('Select the primary currency for all transactions.', currentLanguage.code, 'ui')}
                                >
                                    <Select defaultValue={defaultCurrency}>
                                        <SelectTrigger className="w-[200px] h-10 rounded-xl border-2 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                            <SelectItem value="INR">INR (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingItem>

                                <SettingItem
                                    icon={Zap}
                                    title={t('Fast Mode', currentLanguage.code, 'ui')}
                                    desc={t('Skip confirmation dialogs for rapid scanning.', currentLanguage.code, 'ui')}
                                >
                                    <Switch defaultChecked={fastMode} />
                                </SettingItem>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-black tracking-tight">{t('Appearance & UX', currentLanguage.code, 'ui')}</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <SettingItem
                                    icon={Layout}
                                    title={t('Default View', currentLanguage.code, 'ui')}
                                    desc={t('Choose how products are listed by default.', currentLanguage.code, 'ui')}
                                >
                                    <div className="flex gap-2 bg-muted/50 p-1 rounded-xl border-2">
                                        <Button size="sm" variant="secondary" className="h-8 rounded-lg font-black text-[10px] uppercase">{t('Grid', currentLanguage.code, 'ui')}</Button>
                                        <Button size="sm" variant="ghost" className="h-8 rounded-lg font-black text-[10px] uppercase">{t('List', currentLanguage.code, 'ui')}</Button>
                                    </div>
                                </SettingItem>

                                <SettingItem
                                    icon={Palette}
                                    title={t('Glassmorphism Effects', currentLanguage.code, 'ui')}
                                    desc={t('Enable blur and transparency for a modern look.', currentLanguage.code, 'ui')}
                                >
                                    <Switch defaultChecked={glassmorphism} />
                                </SettingItem>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'data' || activeTab === 'security' || activeTab === 'notifications') && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-black tracking-tight">
                                {menuItems.find(i => i.id === activeTab)?.label}
                            </h3>

                            <div className="p-6 rounded-[24px] border-2 bg-muted/20 border-dashed space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-background border flex items-center justify-center text-muted-foreground shrink-0">
                                        <HardDrive className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-sm">{t('Status', currentLanguage.code, 'ui')}</h4>
                                        <p className="text-xs font-bold text-muted-foreground mt-1">
                                            {t('No specific settings available for this section yet.', currentLanguage.code, 'ui')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex sm:hidden py-4 border-t">
                <Button className="w-full h-14 rounded-2xl font-black shadow-2xl shadow-primary/20 gap-2">
                    <Save className="w-5 h-5" /> {t('Save All Changes', currentLanguage.code, 'ui')}
                </Button>
            </div>
        </div >
    );
}
