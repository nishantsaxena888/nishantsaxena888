import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { LayoutDashboard, Box, ShoppingCart, ArrowRight, User, Settings, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"


interface HomeComponentProps {
  schemaProperties?: any;
  logo?: React.ReactNode;
  title?: string;
  description?: string;
  features?: any[];
  logout?: () => void;
  onNavigate?: (path: string) => void;
  renderThemeSwitcher?: React.ReactNode;
  userInitials?: string;
}

export const HomeComponent = ({
  schemaProperties,
  logo,
  title,
  description,
  features = [],
  logout,
  onNavigate = () => {},
  renderThemeSwitcher,
  userInitials = "AD"
}: HomeComponentProps) => {
  const labels = schemaProperties?.labels || {};
  const IconMap: Record<string, any> = { LayoutDashboard, Box, ShoppingCart };

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 text-center space-y-4 sm:space-y-8 animate-in fade-in duration-700 overflow-hidden">
      <div className="fixed top-2 right-2 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-3 z-50">
        {renderThemeSwitcher}
        <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block opacity-50" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-accent/50 transition-all bg-card/50 backdrop-blur-xl px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 shadow-sm shrink-0 min-h-[36px] sm:min-h-[44px]">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] sm:text-xs font-black leading-tight uppercase tracking-tighter">{labels.managerAccess || 'Manager Access'}</p>
                <p className="text-[8px] sm:text-[9px] uppercase font-bold text-primary tracking-widest">{labels.admin || 'Admin'}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black shadow-inner text-[10px] sm:text-xs shrink-0 text-primary">{userInitials}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-2 rounded-[24px] shadow-2xl border-2 bg-popover/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuItem
              className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => onNavigate('/my-profile')}
            >
              <User className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{labels.myProfile || 'My Profile'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => onNavigate('/settings')}
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{labels.settings || 'Settings'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => onNavigate('/admin')}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{labels.adminDashboard || 'Admin Dashboard'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-muted/50" />
            <DropdownMenuItem
              className="flex items-center gap-4 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-destructive/10 transition-colors text-destructive"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{labels.logout || 'Logout'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 sm:space-y-4 max-w-2xl px-4 w-full">
        <div className="w-12 h-12 sm:w-20 sm:h-20 bg-primary rounded-xl sm:rounded-[28px] flex items-center justify-center text-primary-foreground text-xl sm:text-4xl shadow-xl mx-auto ring-4 sm:ring-8 ring-primary/10">
          {logo}
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-5xl font-black tracking-tighter leading-none">
            {title} <span className="text-primary">{labels.pos || 'POS'}</span>
          </h1>
          <p className="text-xs sm:text-lg text-muted-foreground font-bold tracking-tight px-4">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-4xl px-4">
        {features.map((item: any, i: number) => {
          const Icon = IconMap[item.iconName] || Box;
          return (
            <Card key={i} className="p-3 sm:p-6 rounded-2xl sm:rounded-[24px] border-2 bg-card/50 backdrop-blur-xl flex flex-row sm:flex-col items-center sm:items-start text-left sm:text-left gap-3 sm:space-y-2 hover:border-primary transition-all group overflow-hidden">
              <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs sm:text-base font-black tracking-tight">{item.title}</h3>
                <p className="text-[9px] sm:text-xs text-muted-foreground font-bold leading-tight sm:leading-relaxed line-clamp-2">{item.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        size="lg"
        className="h-12 sm:h-16 px-6 sm:px-12 rounded-xl sm:rounded-2xl text-sm sm:text-lg font-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 sm:gap-4 w-[calc(100%-2rem)] sm:w-auto"
        onClick={() => onNavigate('/pos')}
      >
        {labels.openPosTerminal || 'Open POS Terminal'} <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
      </Button>

    </div>
  )
}
