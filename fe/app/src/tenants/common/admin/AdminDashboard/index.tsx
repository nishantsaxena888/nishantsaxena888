import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Package, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityManagement } from '../entity-management/EntityManagement';

import { ProfilePage } from '../ProfilePage';
import { SettingsPage } from '../SettingsPage';

import { AdminLayout } from '../AdminLayout';

import { useAdmin } from './hooks/use-admin';

export function AdminDashboard(props: any) {
    const { onBack: propsOnBack } = props;
    const {
        currentView,
        setCurrentView,
        onBack,
        transactions
    } = useAdmin(propsOnBack);

    return (
        <AdminLayout
            onBack={onBack}
            currentView={currentView}
            onViewChange={setCurrentView}
        >
            {currentView === 'dashboard' ? (
                <Tabs defaultValue="inventory">
                    <TabsList className="mb-8 w-full justify-start overflow-x-auto no-scrollbar border-b rounded-none bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="inventory" className="gap-2 pb-4 px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shrink-0">
                            <Package className="w-4 h-4" /> Inventory
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="gap-2 pb-4 px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shrink-0">
                            <History className="w-4 h-4" /> Transactions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="catalog" className="mt-6 flex-1 bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
                    <EntityManagement targetEntity={props.targetEntity || "product"} />
                </TabsContent>

                    <TabsContent value="transactions">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle className="text-xl font-black">Transaction Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px] pr-4">
                                    <div className="space-y-4">
                                        {transactions.length === 0 && (
                                            <div className="py-20 text-center text-muted-foreground font-bold italic">
                                                No transactions recorded yet.
                                            </div>
                                        )}
                                        {transactions.map((t: any) => (
                                            <div key={t.id} className="p-4 rounded-xl border-2 bg-card/50 flex justify-between items-center group hover:border-primary/30 transition-all">
                                                <div>
                                                    <p className="font-black text-sm">{t.id}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black">{new Date(t.timestamp).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-primary">${t.total.toFixed(2)}</p>
                                                    <Badge variant="secondary" className="text-[8px] uppercase">{t.theme}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : currentView === 'profile' ? (
                <ProfilePage {...props} />
            ) : (
                <SettingsPage {...props} />
            )}
        </AdminLayout>
    );
}
