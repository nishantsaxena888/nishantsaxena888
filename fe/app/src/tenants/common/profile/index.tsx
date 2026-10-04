import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Heart,
  HelpCircle,
  Bell,
  CreditCard,
  ShoppingBag,
  Settings,
  LogOut,
  Check,
  Zap,
  TrendingUp,
  User,
  Package,
  ChevronRight,
  Shield,
  ArrowLeft,
  Camera,
  Upload,
  Trash2,
  Home,
  Building2,
  X,
  ChevronLeft,
  Search,
  Lock,
  Eye,
  FileText,
  Plus,
  Edit2,
  MessageCircle,
  Star,
  Phone,
  Mail
} from "lucide-react";
import { useAdmin, apiClient } from "@/engine";
import { useGenericState } from "@/store/use-generic-state";
import { toast } from "sonner";
import { formInput } from "@/components/form-input/form-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FormRender } from "@/components/shared/form-render";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { storage } from "@/platform/storage";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface MyAccountLabels {
  heading: string;
  memberBadge: string;
  editProfile: string;
  signOut: string;
  vipBadge: string;
  statOrders: string;
  statWishlist: string;
  statPoints: string;
  statAddresses: string;
  navOverview: string;
  navOrders: string;
  navAddresses: string;
  navWishlist: string;
  navSettings: string;
  navHelp: string;
  navPrivacy: string;
  supportTitle: string;
  supportDesc: string;
  supportCta: string;
  recentOrdersTitle: string;
  recentOrdersSub: string;
  viewAll: string;
  quickActionsTitle: string;
  shopNow: string;
  myWishlist: string;
  addressesLabel: string;
  payment: string;
  notifications: string;
  help: string;
  ordersTitle: string;
  ordersSub: string;
  viewDetails: string;
  addressesTitle: string;
  addressesSub: string;
  wishlistTitle: string;
  wishlistSub: string;
  wishlistEmpty: string;
  wishlistEmptyDesc: string;
  startShopping: string;
  statusDelivered: string;
  statusProcessing: string;
  statusCancelled: string;
  showingOrders: string;
  photoSettings: string;
  returnToShop: string;
  addressDeliveryTitle: string;
  addressSavedTitle: string;
  addressManageMsg: string;
  addressAddNew: string;
  addressUpdateDetails: string;
  addressNewDestination: string;
  addressFullName: string;
  addressPhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressType: string;
  addressTypeHome: string;
  addressTypeWork: string;
  addressTypeOther: string;
  addressUseDefault: string;
  addressCancel: string;
  addressSave: string;
  addressUpdate: string;
  addressDefaultBadge: string;
  addressEmptyMsg: string;
  photoSettingsDesc?: string;
  uploadNewPhoto?: string;
  removeCurrentPhoto?: string;
  cancel?: string;
  fullName?: string;
  emailAddress?: string;
  saveChanges?: string;
  settingsStoredLocally?: string;
  totalLabel?: string;
}

export interface MyAccountOrder {
  id: string;
  date: string;
  status: string;
  total: string;
  items: number;
}

export interface MyAccountStats {
  orders: string;
  wishlist: string;
  points: string;
  addresses: string;
}

export type AccountTab = 'overview' | 'orders' | 'addresses' | 'wishlist' | 'settings' | 'help' | 'privacy';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

const DEFAULT_LABELS: MyAccountLabels = {
  heading: "",
  memberBadge: "",
  editProfile: "",
  signOut: "",
  vipBadge: "",
  statOrders: "",
  statWishlist: "",
  statPoints: "",
  statAddresses: "",
  navOverview: "",
  navOrders: "",
  navAddresses: "",
  navWishlist: "",
  navSettings: "",
  navHelp: "",
  navPrivacy: "",
  supportTitle: "",
  supportDesc: "",
  supportCta: "",
  recentOrdersTitle: "",
  recentOrdersSub: "",
  viewAll: "",
  quickActionsTitle: "",
  shopNow: "",
  myWishlist: "",
  addressesLabel: "",
  payment: "",
  notifications: "",
  help: "",
  ordersTitle: "",
  ordersSub: "",
  viewDetails: "",
  addressesTitle: "",
  addressesSub: "",
  wishlistTitle: "",
  wishlistSub: "",
  wishlistEmpty: "",
  wishlistEmptyDesc: "",
  startShopping: "",
  statusDelivered: "",
  statusProcessing: "",
  statusCancelled: "",
  showingOrders: "",
  photoSettings: "",
  returnToShop: "",
  addressDeliveryTitle: "",
  addressSavedTitle: "",
  addressManageMsg: "",
  addressAddNew: "",
  addressUpdateDetails: "",
  addressNewDestination: "",
  addressFullName: "",
  addressPhone: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
  addressType: "",
  addressTypeHome: "",
  addressTypeWork: "",
  addressTypeOther: "",
  addressUseDefault: "",
  addressCancel: "",
  addressSave: "",
  addressUpdate: "",
  addressDefaultBadge: "",
  addressEmptyMsg: "",
  photoSettingsDesc: "",
  uploadNewPhoto: "",
  removeCurrentPhoto: "",
  cancel: "",
  fullName: "",
  emailAddress: "",
  saveChanges: "",
  settingsStoredLocally: "",
  totalLabel: ""
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

interface AccountProfileHeaderProps {
  user: { name: string; email: string };
  labels: MyAccountLabels;
  stats: MyAccountStats;
  onEditProfile: () => void;
  onSignOut: () => void;
  children?: React.ReactNode;
}

export function AccountProfileHeader({ user, labels, stats, onEditProfile, onSignOut, children }: AccountProfileHeaderProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative overflow-hidden bg-primary">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/30 shadow-2xl rounded-[28px] md:rounded-[36px]">
              <AvatarFallback className="text-3xl md:text-4xl font-black bg-white/20 backdrop-blur-md text-white rounded-[24px] md:rounded-[32px] w-full h-full flex items-center justify-center">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-primary flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <p className="text-primary-foreground/60 text-xs font-black uppercase tracking-[0.2em] mb-1">
                {labels.heading}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-primary-foreground leading-none">
                {user.name}
              </h1>
              <p className="text-primary-foreground/70 text-sm font-bold mt-2">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3 h-3 mr-1.5" /> {labels.vipBadge}
              </Badge>
              <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <TrendingUp className="w-3 h-3 mr-1.5" /> {stats.points} pts
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl font-bold h-11 md:h-10 px-5 w-full sm:w-auto cursor-pointer"
              onClick={onEditProfile}
            >
              <Settings className="w-4 h-4 mr-2" /> {labels.editProfile}
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-xl font-bold h-11 md:h-10 px-4 w-full sm:w-auto bg-white/5 sm:bg-transparent cursor-pointer"
              onClick={onSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" /> {labels.signOut}
            </Button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

interface AccountStatCardsProps {
  stats: MyAccountStats;
  labels: MyAccountLabels;
}

export function AccountStatCards({ stats, labels }: AccountStatCardsProps) {
  const STAT_ITEMS = [
    { label: labels.statOrders, value: stats.orders, icon: Package, color: 'bg-blue-500/10 text-blue-500' },
    { label: labels.statWishlist, value: stats.wishlist, icon: Heart, color: 'bg-rose-500/10 text-rose-500' },
    { label: labels.statPoints, value: stats.points, icon: Star, color: 'bg-amber-500/10 text-amber-500' },
    { label: labels.statAddresses, value: stats.addresses, icon: MapPin, color: 'bg-green-500/10 text-green-500' },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_ITEMS.map((stat) => (
        <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-primary-foreground border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AccountSidebarProps {
  activeTab: AccountTab;
  setActiveTab: (tab: AccountTab) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  ordersCount: number;
  labels: MyAccountLabels;
  onSignOut: () => void;
}

export function AccountSidebar({ activeTab, setActiveTab, mobileNavOpen, setMobileNavOpen, ordersCount, labels, onSignOut }: AccountSidebarProps) {
  const NAV_ITEMS: { id: AccountTab; icon: React.ElementType; label: string; color: string; badge?: string }[] = [
    { id: 'overview', icon: User, label: labels.navOverview, color: 'text-violet-500' },
    { id: 'orders', icon: Package, label: labels.navOrders, color: 'text-blue-500', badge: String(ordersCount) },
    { id: 'addresses', icon: MapPin, label: labels.navAddresses, color: 'text-green-500' },
    { id: 'wishlist', icon: Heart, label: labels.navWishlist, color: 'text-rose-500' },
    { id: 'settings', icon: Settings, label: labels.navSettings, color: 'text-orange-500' },
    { id: 'help', icon: HelpCircle, label: labels.navHelp, color: 'text-cyan-500' },
    { id: 'privacy', icon: Shield, label: labels.navPrivacy, color: 'text-slate-500' },
  ];

  const activeNav = NAV_ITEMS.find(n => n.id === activeTab)!;

  return (
    <aside className="md:w-64 shrink-0">
      {/* Mobile nav toggle */}
      <button
        className="md:hidden w-full flex items-center justify-between p-4 bg-card border rounded-2xl mb-4 font-bold cursor-pointer"
        onClick={() => setMobileNavOpen(v => !v)}
      >
        <span className="flex items-center gap-3">
          <activeNav.icon className={`w-5 h-5 ${activeNav.color}`} />
          {activeNav.label}
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform ${mobileNavOpen ? 'rotate-90' : ''}`} />
      </button>

      <nav className={`space-y-1 ${mobileNavOpen ? 'block' : 'hidden md:block'} bg-card border rounded-[28px] p-3 shadow-sm`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm group cursor-pointer
              ${activeTab === item.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'hover:bg-muted text-foreground'}`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-primary-foreground' : item.color}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge className={`text-[9px] font-black min-w-5 h-5 flex items-center justify-center rounded-full px-1.5 ${activeTab === item.id ? 'bg-white/20 text-white border-none' : 'bg-primary/10 text-primary border-none'}`}>
                {item.badge}
              </Badge>
            )}
          </button>
        ))}

        <Separator className="my-2" />

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm hover:bg-destructive/5 text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{labels.signOut}</span>
        </button>
      </nav>

      {/* Support card */}
      <div className="hidden md:block mt-4 rounded-[28px] bg-primary/5 border border-primary/10 p-6 space-y-4">
        <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-black text-base tracking-tight leading-none">{labels.supportTitle}</h4>
          <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed">
            {labels.supportDesc}
          </p>
        </div>
        <Button
          className="w-full rounded-xl font-black h-10 shadow-lg shadow-primary/20 text-sm cursor-pointer"
          onClick={() => setActiveTab('help')}
        >
          {labels.supportCta}
        </Button>
      </div>
    </aside>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  Processing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

interface AccountOrderCardProps {
  order: MyAccountOrder;
  labels?: { viewDetails?: string; totalLabel?: string };
  variant?: 'compact' | 'full';
}

export function AccountOrderCard({ order, labels, variant = 'compact' }: AccountOrderCardProps) {
  if (variant === 'full') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-5 sm:p-6 bg-card border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all group">
        <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-black text-sm sm:text-base">{order.id}</p>
              <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status] ?? ''}`}>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-bold">
              {order.date} · {order.items} item{order.items !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-border/50">
          <p className="font-black text-lg sm:text-xl">{order.total}</p>
          {labels?.viewDetails && (
            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs h-8 cursor-pointer">
              {labels.viewDetails}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-card border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto sm:flex-1 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-sm">{order.id}</p>
            <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status] ?? ''}`}>
              {order.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-bold mt-0.5">
            {order.date} · {order.items} item{order.items !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-none border-border/50">
        <p className="text-xs sm:hidden font-bold text-muted-foreground uppercase tracking-widest">{labels?.totalLabel || "Total"}</p>
        <p className="font-black text-base shrink-0">{order.total}</p>
      </div>
    </div>
  );
}
interface SettingsViewProps {
  user: { name: string; email: string } | null;
  onClose: () => void;
  onSaveProfile?: (updatedUser: { name: string; email: string }) => void;
  inline?: boolean;
  labels: MyAccountLabels;
}

export function SettingsView({ user, onClose, onSaveProfile, inline, labels }: SettingsViewProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (onSaveProfile) {
      onSaveProfile({ name, email });
    }
    onClose();
  };

  if (inline) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div>
          <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">{labels.editProfile}</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Manage your account settings</p>
        </div>

        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-[40px] bg-primary/10 flex items-center justify-center text-4xl font-black text-primary border-4 border-primary/20 shadow-2xl overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[40px]">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
              <div className="bg-primary p-8 text-primary-foreground">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
                    {labels.photoSettings}
                  </DialogTitle>
                  <DialogDescription className="text-primary-foreground/70 font-bold uppercase tracking-widest text-[10px]">
                    Manage your professional profile appearance
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Button
                  className="w-full h-14 rounded-2xl font-black flex items-center gap-3 bg-muted hover:bg-muted/80 text-foreground transition-all group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Upload className="w-4 h-4" />
                  </div>
                  {labels.uploadNewPhoto || "Upload New Photo"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-14 rounded-2xl font-black flex items-center gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all group cursor-pointer"
                  onClick={handleRemoveImage}
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  {labels.removeCurrentPhoto || "Remove Current Photo"}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center">
            <h3 className="text-lg font-black tracking-tight">{name}</h3>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">{email}</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-8 bg-muted/20 p-8 rounded-[40px] border border-border/50 backdrop-blur-sm">
          <div className="grid gap-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{labels.fullName || "Full Name"}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nishant Saxena"
                className="h-14 px-6 rounded-2xl border-none bg-background shadow-inner focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{labels.emailAddress || "Email Address"}</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="nishant.saxena@example.com"
                className="h-14 px-6 rounded-2xl border-none bg-background shadow-inner focus-visible:ring-primary/20 font-bold"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 cursor-pointer"
              onClick={handleSave}
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs border-2 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-2xl hover:bg-muted transition-all active:scale-90 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase italic text-primary">
              {labels.editProfile}
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-6">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-[40px] bg-primary/10 flex items-center justify-center text-4xl font-black text-primary border-4 border-primary/20 shadow-2xl overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[40px]">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-primary p-8 text-primary-foreground">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
                      {labels.photoSettings}
                    </DialogTitle>
                    <DialogDescription className="text-primary-foreground/70 font-bold uppercase tracking-widest text-[10px]">
                      Manage your professional profile appearance
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-6 space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Button
                    className="w-full h-14 rounded-2xl font-black flex items-center gap-3 bg-muted hover:bg-muted/80 text-foreground transition-all group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Upload className="w-4 h-4" />
                    </div>
                    {labels.uploadNewPhoto || "Upload New Photo"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-14 rounded-2xl font-black flex items-center gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all group cursor-pointer"
                    onClick={handleRemoveImage}
                  >
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    {labels.removeCurrentPhoto || "Remove Current Photo"}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 cursor-pointer">
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>

            <div className="text-center">
              <h3 className="text-lg font-black tracking-tight">{name}</h3>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">{email}</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-8 bg-muted/20 p-8 rounded-[40px] border border-border/50 backdrop-blur-sm">
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{labels.fullName || "Full Name"}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-16 rounded-2xl bg-background border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6 text-lg" />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{labels.emailAddress || "Email Address"}</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} className="h-16 rounded-2xl bg-background border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6 text-lg" />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="w-full h-16 rounded-[24px] font-black shadow-2xl shadow-primary/20 text-lg uppercase tracking-tight hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">
          Settings are stored locally in your current session.
        </p>
      </main>
    </div>
  );
}

interface HelpViewProps {
  config: any;
  properties?: any;
  onClose: () => void;
  inline?: boolean;
  labels: MyAccountLabels;
}

export function HelpView({ config, properties, onClose, inline, labels }: HelpViewProps) {
  const faqs = properties?.faqs || [
    { q: "How do I track my order?", a: "You can track your order in the 'Order History' section of your profile." },
    { q: "What is your return policy?", a: "We offer a 30-day return policy for most items in their original condition." },
    { q: "Do you offer international shipping?", a: "Currently, we only ship within the continental United States." },
    { q: "How can I contact support?", a: "You can reach us via the contact form below or by calling our support line." }
  ];

  const phone = config?.phone || "+1 (555) 019-2834";
  const name = config?.name || "Nishify";

  if (inline) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div>
          <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">
            How can we <span className="text-primary">help?</span>
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Search our FAQ or contact support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search for help articles..."
                className="h-16 pl-16 pr-8 text-lg rounded-2xl border-none bg-muted/30 shadow-inner focus-visible:ring-primary/20 font-bold"
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((faq: any, i: number) => (
                  <div key={i} className="p-6 rounded-[28px] bg-background border hover:border-primary/30 transition-all hover:shadow-xl group">
                    <h4 className="font-black text-base mb-2 group-hover:text-primary transition-colors">{faq.q}</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="bg-primary rounded-[32px] p-6 text-primary-foreground shadow-2xl space-y-4 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
              <h4 className="text-lg font-black tracking-tight relative z-10">Contact Support</h4>
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-bold">{phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-bold">support@{name.toLowerCase().replace(/\s+/g, '')}.com</span>
                </div>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-xl h-12 font-black shadow-lg relative z-10 cursor-pointer">
                <MessageCircle className="w-4 h-4 mr-2" /> Live Chat
              </Button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="mb-4 -ml-4 hover:bg-primary/5 text-primary font-bold rounded-xl cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> {labels.returnToShop}
          </Button>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            How can we <span className="text-primary">help?</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Search our help center or contact our support team for any assistance you need.
          </p>
        </div>
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary">
          <HelpCircle className="w-12 h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search for help articles..."
              className="h-20 pl-16 pr-8 text-xl rounded-[30px] border-none bg-muted/30 shadow-inner focus-visible:ring-primary/20 font-bold"
            />
          </div>

          <div className="space-y-8">
            <h3 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq: any, i: number) => (
                <div key={i} className="p-8 rounded-[40px] bg-background border hover:border-primary/30 transition-all hover:shadow-xl group">
                  <h4 className="font-black text-lg mb-4 group-hover:text-primary transition-colors">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="bg-primary rounded-[40px] p-8 text-primary-foreground shadow-2xl space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <h4 className="text-xl font-black tracking-tight relative z-10">Contact Support</h4>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="font-bold">{phone}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-bold">support@{name.toLowerCase().replace(/\s+/g, '')}.com</span>
              </div>
            </div>
            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black shadow-xl relative z-10 cursor-pointer">
              <MessageCircle className="w-5 h-5 mr-2" /> Live Chat
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface PrivacyViewProps {
  config: any;
  properties?: any;
  onClose: () => void;
  inline?: boolean;
  labels: MyAccountLabels;
}

export function PrivacyView({ config, properties, onClose, inline, labels }: PrivacyViewProps) {
  const name = config?.name || "Nishify";

  const privacyPolicy = properties?.privacyPolicy || {
    sections: [
      {
        title: "Information Collection",
        content: [
          "We collect information that you provide directly to us when you create an account, make a purchase, or communicate with us. This may include your name, email address, shipping address, and payment information.",
          `We also automatically collect certain information when you visit ${name}, such as your IP address, browser type, and how you interact with our platform.`
        ]
      },
      {
        title: "Data Security",
        content: [
          "We implement industry-standard security measures to protect your information from unauthorized access, alteration, or disclosure. This includes SSL encryption for all data transfers and secure storage for sensitive information."
        ]
      }
    ],
    summary: [
      "We never sell your personal data.",
      "We use cookies only to enhance your experience.",
      "You have full control over your data.",
      "Secure SSL-encrypted transactions."
    ]
  };

  const getSectionIcon = (index: number) => {
    if (index === 0) return <Eye className="w-5 h-5 text-primary" />;
    return <Lock className="w-5 h-5 text-primary" />;
  };

  const getSectionIconLarge = (index: number) => {
    if (index === 0) return <Eye className="w-6 h-6 text-primary" />;
    return <Lock className="w-6 h-6 text-primary" />;
  };

  if (inline) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <div>
          <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">
            Privacy <span className="text-primary">Policy</span>
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            How we protect your data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {privacyPolicy.sections.map((section: any, idx: number) => (
              <section key={idx} className="space-y-4">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  {getSectionIcon(idx)} {section.title}
                </h3>
                <div className="text-xs text-muted-foreground font-medium leading-relaxed space-y-2">
                  {section.content.map((paragraph: string, pIdx: number) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-8">
            <div className="bg-primary/5 rounded-[32px] p-6 border border-primary/10 space-y-4">
              <h4 className="text-base font-black tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Quick Summary
              </h4>
              <ul className="space-y-3">
                {privacyPolicy.summary.map((text: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="mb-4 -ml-4 hover:bg-primary/5 text-primary font-bold rounded-xl cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> {labels.returnToShop}
          </Button>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Your privacy is our priority. We are committed to protecting your personal data and being transparent about how we use it.
          </p>
        </div>
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary">
          <Shield className="w-12 h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {privacyPolicy.sections.map((section: any, idx: number) => (
            <section key={idx} className="space-y-6">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                {getSectionIconLarge(idx)} {section.title}
              </h3>
              <div className="prose prose-emerald dark:prose-invert max-w-none text-muted-foreground font-medium leading-relaxed space-y-4">
                {section.content.map((paragraph: string, pIdx: number) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-8">
          <div className="bg-primary/5 rounded-[40px] p-8 border border-primary/10 space-y-6">
            <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Quick Summary
            </h4>
            <ul className="space-y-4">
              {privacyPolicy.summary.map((text: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface AddressManagerProps {
  onSelectAddress?: (address: Address) => void;
  selectedAddressId?: string;
  mode?: 'manage' | 'select';
  labels: MyAccountLabels;
}

export function AddressManager({ onSelectAddress, selectedAddressId, mode = 'manage', labels }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    type: 'home',
    isDefault: false,
  });

  const addressFormFields = [
    { name: "fullName", type: "text", label: labels.addressFullName, required: true, width: "half" },
    { name: "phone", type: "text", label: labels.addressPhone, required: true, width: "half" },
    { name: "address", type: "text", label: labels.addressStreet, required: true, width: "full" },
    { name: "city", type: "text", label: labels.addressCity, required: true, width: "third" },
    { name: "state", type: "text", label: labels.addressState, required: true, width: "third" },
    { name: "zipCode", type: "text", label: labels.addressZip, required: true, width: "third" },
    {
      name: "type",
      type: "select",
      label: labels.addressType,
      required: true,
      width: "half",
      options: [
        { label: labels.addressTypeHome, value: "home" },
        { label: labels.addressTypeWork, value: "work" },
        { label: labels.addressTypeOther, value: "other" }
      ]
    },
    { name: "isDefault", type: "switch", label: labels.addressUseDefault, width: "half" }
  ];

  useEffect(() => {
    const savedAddresses = storage.getItem('shippingAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, []);

  const saveAddresses = (newAddresses: Address[]) => {
    storage.setItem('shippingAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
    window.dispatchEvent(new CustomEvent('addressesUpdated'));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    let newAddresses: Address[];

    const addressData: Address = {
      id: editingAddress ? editingAddress.id : Date.now().toString(),
      fullName: formData.fullName || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      country: formData.country || 'United States',
      type: formData.type || 'home',
      isDefault: !!formData.isDefault,
    };

    if (editingAddress) {
      newAddresses = addresses.map(addr =>
        addr.id === editingAddress.id
          ? addressData
          : addressData.isDefault ? { ...addr, isDefault: false } : addr
      );
    } else {
      newAddresses = addressData.isDefault
        ? [...addresses.map(addr => ({ ...addr, isDefault: false })), addressData]
        : [...addresses, addressData];
    }

    saveAddresses(newAddresses);
    resetForm();
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      type: address.type,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleDeleteAddress = (id: string) => {
    const newAddresses = addresses.filter(addr => addr.id !== id);
    saveAddresses(newAddresses);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      type: 'home',
      isDefault: false,
    });
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Building2 className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {mode === 'select' ? labels.addressDeliveryTitle : labels.addressSavedTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{labels.addressManageMsg}</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="rounded-full gap-2 shadow-lg shadow-primary/20 cursor-pointer">
            <Plus className="w-4 h-4" />
            {labels.addressAddNew}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold">
              {editingAddress ? labels.addressUpdateDetails : labels.addressNewDestination}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-full cursor-pointer">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                {addressFormFields.map((field) => {
                  const InputComponent = formInput[field.type as keyof typeof formInput] || formInput.text;
                  const colSpan = field.width === 'half' ? 'col-span-12 md:col-span-6' : field.width === 'third' ? 'col-span-12 md:col-span-4' : 'col-span-12';

                  return (
                    <div key={field.name} className={`space-y-2 ${colSpan} ${field.type === 'switch' ? 'flex items-center pt-8' : ''}`}>
                      {field.type !== 'switch' ? (
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          {field.label && (
                            <Label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
                              {field.label}
                            </Label>
                          )}
                          <InputComponent
                            name={field.name}
                            value={formData[field.name]}
                            onChange={(val: any) => setFormData(prev => ({ ...prev, [field.name]: val }))}
                            required={field.required}
                          />
                        </div>
                      )}

                      {field.type !== 'switch' && (
                        <InputComponent
                          name={field.name}
                          value={formData[field.name]}
                          onChange={(val: any) => setFormData(prev => ({ ...prev, [field.name]: val }))}
                          required={field.required}
                          placeholder={field.label}
                          options={field.options}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 h-11 font-bold rounded-xl cursor-pointer">
                  {editingAddress ? labels.addressUpdate : labels.addressSave}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="h-11 rounded-xl cursor-pointer">
                  {labels.addressCancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <div className="grid gap-3">
          {addresses.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-3xl bg-muted/20">
              <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{labels.addressEmptyMsg}</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedAddressId}
              onValueChange={id => onSelectAddress?.(addresses.find(a => a.id === id)!)}
              className="grid gap-3"
            >
              {[...addresses].sort((a) => (a.isDefault ? -1 : 1)).map((address) => (
                <Label
                  key={address.id}
                  htmlFor={address.id}
                  className={`relative flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer bg-card group ${selectedAddressId === address.id
                    ? 'border-primary shadow-lg shadow-primary/5 bg-primary/5'
                    : 'border-border hover:border-primary/40'
                    }`}
                >
                  {mode === 'select' && (
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${selectedAddressId === address.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                        {getAddressIcon(address.type)}
                      </div>
                      <span className="font-bold tracking-tight text-foreground capitalize">{address.type}</span>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-[9px] uppercase font-black px-1.5 h-4 bg-primary/20 text-primary border-none">
                          {labels.addressDefaultBadge}
                        </Badge>
                      )}
                    </div>

                    <div className="pl-12 space-y-1">
                      <p className="text-sm font-bold text-foreground">{address.fullName}</p>
                      <p className="text-xs text-muted-foreground">{address.address}</p>
                      <p className="text-xs text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                    </div>
                  </div>

                  {mode === 'manage' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditAddress(address)} className="h-8 w-8 rounded-full cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(address.id)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {address.isDefault && <Check className="absolute top-5 right-5 w-4 h-4 text-primary" />}
                </Label>
              ))}
            </RadioGroup>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Master View ─────────────────────────────────────────────────────────────

const QUICK_ACTION_ICONS: Record<string, React.ComponentType<any>> = {
  MapPin,
  Heart,
  HelpCircle,
  Bell,
  CreditCard,
  ShoppingBag,
  Settings,
  LogOut,
  User,
  Package,
  Shield,
  Home,
  Building2,
  Lock,
  Eye,
  FileText,
  MessageCircle,
  Star,
  Phone,
  Mail
};

const EMPTY_ARRAY: any[] = [];

export interface MyAccountViewProps {
  user: { name: string; email: string } | null;
  config: any;
  labels: MyAccountLabels;
  stats: MyAccountStats;
  orders: MyAccountOrder[];
  onSignOut: () => void;
  onShopNow?: () => void;
  onSaveProfile?: (updatedUser: { name: string; email: string }) => void;
  properties?: any;
}

export function MyAccountView({
  user,
  config,
  labels,
  stats,
  orders,
  onSignOut,
  onShopNow,
  onSaveProfile,
  properties,
}: MyAccountViewProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const wishlist = useGenericState((state: any) => state.data["wishlist"] || EMPTY_ARRAY);
  const gsUpdate = useGenericState((state: any) => state.update);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    apiClient("product").then((res) => {
      const data = res.data?.data || res.data || [];
      setAllProducts(data);
    }).catch(err => console.error("Failed to load products in wishlist:", err));
  }, []);

  const wishlistItems = useMemo(() => {
    if (!Array.isArray(wishlist)) return [];
    return wishlist.map((item: any) => {
      if (typeof item === "object" && item !== null) {
        return item;
      }
      return allProducts.find((p) => String(p.id) === String(item));
    }).filter(Boolean);
  }, [wishlist, allProducts]);

  const handleAddToCart = (product: any) => {
    gsUpdate("cart", {
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    gsUpdate("wishlist", productId);
    toast.success("Item removed from wishlist!");
  };

  const quickActionsConfig = properties?.quickActions || [];

  const quickActions = useMemo(() => {
    return quickActionsConfig.map((item: any) => {
      const IconComponent = QUICK_ACTION_ICONS[item.icon] || HelpCircle;
      const label = labels[item.labelKey as keyof MyAccountLabels] || item.label || "";
      let actionFn = () => {};
      switch (item.action) {
        case "shopNow":
          actionFn = onShopNow || (() => {});
          break;
        case "wishlist":
          actionFn = () => setActiveTab("wishlist");
          break;
        case "addresses":
          actionFn = () => setActiveTab("addresses");
          break;
        case "settings":
          actionFn = () => setActiveTab("settings");
          break;
        case "help":
          actionFn = () => setActiveTab("help");
          break;
        default:
          break;
      }
      return {
        icon: IconComponent,
        label,
        color: item.color,
        action: actionFn
      };
    });
  }, [quickActionsConfig, labels, onShopNow]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      {/* Hero Header */}
      <AccountProfileHeader
        user={user}
        labels={labels}
        stats={stats}
        onEditProfile={() => setActiveTab('settings')}
        onSignOut={onSignOut}
      >
        {/* Stats Strip */}
        <AccountStatCards stats={stats} labels={labels} />
      </AccountProfileHeader>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Nav */}
          <AccountSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
            ordersCount={orders.length}
            labels={labels}
            onSignOut={onSignOut}
          />

          {/* Content Panel */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                {/* Recent Orders */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">{labels.recentOrdersTitle}</h2>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{labels.recentOrdersSub}</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold cursor-pointer" onClick={() => setActiveTab('orders')}>
                      {labels.viewAll}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map(order => (
                      <AccountOrderCard key={order.id} order={order} variant="compact" />
                    ))}
                  </div>
                </section>

                {/* Quick Actions */}
                <section>
                  <h2 className="text-2xl font-black tracking-tight leading-none mb-5 text-foreground">{labels.quickActionsTitle}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {quickActions.map((action: any) => (
                      <button
                        key={action.label}
                        onClick={action.action}
                        className="flex flex-col items-center gap-3 p-6 bg-card border rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group text-center cursor-pointer"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black tracking-tight uppercase text-foreground">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">{labels.ordersTitle}</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{labels.ordersSub}</p>
                </div>
                <div className="space-y-3">
                  {orders.map(order => (
                    <AccountOrderCard key={order.id} order={order} labels={labels} variant="full" />
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  {labels.showingOrders} {orders.length}
                </p>
              </div>
            )}

            {/* ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">{labels.addressesTitle}</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{labels.addressesSub}</p>
                </div>
                <AddressManager mode="manage" labels={labels} />
              </div>
            )}

            {/* WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">{labels.wishlistTitle}</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{labels.wishlistSub}</p>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-24 h-24 rounded-[32px] bg-muted/30 flex items-center justify-center text-muted-foreground/20">
                      <Heart className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight text-foreground">{labels.wishlistEmpty}</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto font-medium">{labels.wishlistEmptyDesc}</p>
                    </div>
                    <Button
                      onClick={onShopNow}
                      className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 cursor-pointer"
                    >
                      <ShoppingBag className="w-5 h-5 mr-3" />
                      {labels.startShopping}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlistItems.map((product: any) => (
                      <Card key={product.id} className="relative overflow-hidden group rounded-2xl border bg-card hover:shadow-lg hover:border-primary/20 transition-all flex flex-col h-full">
                        {/* Image Container */}
                        <div className="relative aspect-square overflow-hidden bg-muted/30">
                          <img
                            src={product.image || "https://placehold.co/400x400/eeeeee/333333?text=Product"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => handleRemoveFromWishlist(product.id)}
                            className="absolute top-3 right-3 w-9 h-9 bg-white/80 hover:bg-white text-rose-500 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                              {product.name}
                            </h4>
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-black text-primary">
                                ${Number(product.price).toFixed(2)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ${Number(product.originalPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-widest gap-2"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {labels.shopNow || "Add to Cart"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView user={user} onClose={() => setActiveTab('overview')} onSaveProfile={onSaveProfile} inline={true} labels={labels} />
            )}

            {/* HELP */}
            {activeTab === 'help' && (
              <HelpView config={config} properties={properties} onClose={() => setActiveTab('overview')} inline={true} labels={labels} />
            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (
              <PrivacyView config={config} properties={properties} onClose={() => setActiveTab('overview')} inline={true} labels={labels} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Page Component ───────────────────────────────────────────────────

export function CustomerProfilePage({ content, properties: directProperties }: any) {
  const { user: loggedInUser, logout, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const wishlist = useGenericState((state: any) => state.data["wishlist"] || EMPTY_ARRAY);

  const properties = directProperties || content?.properties || {};

  // Sync profile update from local or form edit
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !loggedInUser) {
      navigate("/login");
    }
  }, [loggedInUser, authLoading, navigate]);

  useEffect(() => {
    const saved = storage.getItem("user_profile_data");
    if (saved) {
      try {
        setProfileData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local profile data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const saved = storage.getItem("user_profile_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.userDetails?.name) {
          setUserProfile({
            name: parsed.userDetails.name,
            email: parsed.userDetails.email || (loggedInUser?.email || "nishant.saxena@example.com"),
          });
          return;
        }
      } catch (e) {
        console.error("Failed to parse local profile data:", e);
      }
    }

    if (properties?.userDetails?.name) {
      setUserProfile({
        name: properties.userDetails.name,
        email: properties.userDetails.email || (loggedInUser?.email || "nishant.saxena@example.com"),
      });
      return;
    }

    if (loggedInUser) {
      setUserProfile({
        name: loggedInUser.name || "Nishant Saxena",
        email: loggedInUser.email || "nishant.saxena@example.com",
      });
    }
  }, [loggedInUser, properties]);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Load configuration details from JSON properties
  const labels: MyAccountLabels = {
    ...DEFAULT_LABELS,
    ...(properties.labels || {})
  };

  const defaultStats = properties.stats || {
    orders: "12",
    wishlist: "5",
    points: "840",
    addresses: "3"
  };

  // Get shipping addresses count from localStorage
  const savedAddressesStr = storage.getItem("shippingAddresses");
  const savedAddressesCount = savedAddressesStr ? JSON.parse(savedAddressesStr).length : 0;

  const stats: MyAccountStats = {
    orders: String(properties.orders?.length || defaultStats.orders),
    wishlist: String(wishlist.length),
    points: String(defaultStats.points),
    addresses: String(savedAddressesCount || defaultStats.addresses)
  };

  const orders: MyAccountOrder[] = properties.orders || [
    {
      id: "ORD-2026-987",
      date: "2026-06-27",
      status: "Processing",
      total: "$182.40",
      items: 4
    },
    {
      id: "ORD-2026-812",
      date: "2026-06-15",
      status: "Delivered",
      total: "$92.50",
      items: 3
    }
  ];

  const handleSaveProfile = (updatedUser: { name: string; email: string }) => {
    setUserProfile(updatedUser);
    const existing = storage.getItem("user_profile_data");
    let currentData: any = {};
    if (existing) {
      try {
        currentData = JSON.parse(existing);
      } catch (e) {
        console.error(e);
      }
    }
    const merged = {
      ...currentData,
      userDetails: {
        ...(currentData.userDetails || {}),
        name: updatedUser.name,
        email: updatedUser.email
      }
    };
    storage.setItem("user_profile_data", JSON.stringify(merged));
  };

  return (
    <MyAccountView
      user={userProfile}
      config={content?.meta || {}}
      labels={labels}
      stats={stats}
      orders={orders}
      onSignOut={() => logout()}
      onShopNow={() => navigate("/")}
      onSaveProfile={handleSaveProfile}
      properties={properties}
    />
  );
}
