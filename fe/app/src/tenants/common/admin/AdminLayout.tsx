import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Settings, LogOut } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    onBack: () => void;
    currentView?: 'dashboard' | 'profile' | 'settings' | 'custom';
    onViewChange?: (view: 'dashboard' | 'profile' | 'settings') => void;
}

export function AdminLayout({ children, onBack, currentView = 'dashboard', onViewChange }: AdminLayoutProps) {

    const handleBack = () => {
        if (currentView !== 'dashboard' && onViewChange) {
            onViewChange('dashboard');
        } else {
            onBack();
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col animate-in fade-in duration-500">
            <header className="border-b bg-card px-2 sm:px-6 py-2 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-4 min-w-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shrink-0" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                    </Button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm sm:text-2xl font-black tracking-tighter leading-none truncate">Admin Console</h1>
                        <p className="hidden md:block text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest mt-1 truncate">Mode: Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-6 shrink-0">

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <Separator orientation="vertical" className="h-6 sm:h-8 hidden xs:block" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="flex items-center gap-1.5 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-black">Manager Access</p>
                                        <p className="text-[10px] uppercase font-black text-primary">Admin</p>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted border-2 border-border flex items-center justify-center font-black shadow-inner text-xs sm:text-sm shrink-0">AD</div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 p-2 rounded-[24px] shadow-2xl border-2 bg-popover/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
                                <DropdownMenuItem
                                    className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors"
                                    onClick={() => onViewChange?.('profile')}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-tight">My Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors"
                                    onClick={() => onViewChange?.('settings')}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-tight">Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-muted/50" />
                                <DropdownMenuItem className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-destructive/10 transition-colors text-destructive">
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-bold text-sm tracking-tight">Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-auto pb-20 sm:pb-8">
                {children}
            </main>

        </div>
    );
}
