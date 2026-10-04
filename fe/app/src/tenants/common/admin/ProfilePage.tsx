import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Key, Camera, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useEngine } from '../../../engine/contexts/EngineContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useProfile } from './hooks/use-profile';

export function ProfilePage(props: any) {
    const { content } = props;
    const { t, currentLanguage } = useEngine();
    const {
        isUploadDialogOpen,
        setIsUploadDialogOpen,
        isPasswordDialogOpen,
        setIsPasswordDialogOpen,
        previewImage,
        fileInputRef,
        profileName,
        profileRole,
        profileEmail,
        profileBio,
        handleCameraClick,
        handleUploadClick,
        handleFileChange,
        handleRemovePhoto
    } = useProfile(content, currentLanguage);

    return (
        <div key={currentLanguage.code} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">{t('My Profile', currentLanguage.code, 'ui')}</h1>
                    <p className="text-muted-foreground font-medium">{t('Manage your personal information and security.', currentLanguage.code, 'ui')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="space-y-6">
                    <Card className="border-2 overflow-hidden bg-card/50 backdrop-blur-xl">
                        <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary/20 to-primary/5 p-1 ring-4 ring-primary/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                    <div className="w-full h-full rounded-[36px] bg-muted flex items-center justify-center text-4xl font-black text-primary overflow-hidden border-4 border-background">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            "AD"
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    className="absolute -bottom-2 -right-2 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                                    onClick={handleCameraClick}
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <h2 className="mt-6 text-2xl font-black tracking-tight">{profileName}</h2>
                            <p className="text-primary font-black uppercase text-[10px] tracking-widest mt-1">{profileRole}</p>

                            <div className="flex gap-2 mt-4">
                                <Badge variant="secondary" className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase">{t('Active', currentLanguage.code, 'ui')}</Badge>
                                <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase">{t('Pro Plan', currentLanguage.code, 'ui')}</Badge>
                            </div>
                        </CardContent>
                        <Separator />
                        <CardFooter className="bg-muted/30 p-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">{t('Orders', currentLanguage.code, 'ui')}</p>
                                <p className="text-lg font-black tracking-tighter">1,284</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">{t('Revenue', currentLanguage.code, 'ui')}</p>
                                <p className="text-lg font-black tracking-tighter">$42.5k</p>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="border-2 border-primary/20 bg-primary/5 overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-sm">{t('Trust Score', currentLanguage.code, 'ui')}</h3>
                             </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[92%]"></div>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground italic">{t('Your account security is exceptional.', currentLanguage.code, 'ui')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-2 shadow-2xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <User className="w-5 h-5" /> {t('Account Details', currentLanguage.code, 'ui')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('Full Name', currentLanguage.code, 'ui')}</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input defaultValue={profileName} className="pl-11 h-12 rounded-xl border-2 font-bold focus-visible:ring-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('Email Address', currentLanguage.code, 'ui')}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input defaultValue={profileEmail} className="pl-11 h-12 rounded-xl border-2 font-bold focus-visible:ring-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('Bio', currentLanguage.code, 'ui')}</label>
                                <textarea className="w-full min-h-[100px] rounded-xl border-2 font-bold p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    defaultValue={profileBio} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Key className="w-5 h-5" /> {t('Security Settings', currentLanguage.code, 'ui')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-muted/20 group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">{t('Two-Factor Authentication', currentLanguage.code, 'ui')}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground">{t('Add an extra layer of security to your account.', currentLanguage.code, 'ui')}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="rounded-lg font-black text-[10px] uppercase">{t('Enabled', currentLanguage.code, 'ui')}</Badge>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-2 font-black gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                                onClick={() => setIsPasswordDialogOpen(true)}
                            >
                                <Key className="w-4 h-4" /> {t('Change Password', currentLanguage.code, 'ui')}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button variant="ghost" className="h-12 px-8 rounded-xl font-black">{t('Cancel', currentLanguage.code, 'ui')}</Button>
                        <Button className="h-12 px-8 rounded-xl font-black shadow-xl shadow-primary/20 gap-2">
                            <Save className="w-4 h-4" /> {t('Save Changes', currentLanguage.code, 'ui')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Profile Image Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px] border-2 shadow-2xl bg-card/95 backdrop-blur-xl">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-black tracking-tight">{t('Update Profile Photo', currentLanguage.code, 'ui')}</DialogTitle>
                        <DialogDescription className="font-bold text-muted-foreground/70">
                            {t('Choose a new photo or remove the current one.', currentLanguage.code, 'ui')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button variant="outline" className="h-16 rounded-2xl border-2 font-black gap-3 hover:bg-primary/5 transition-all text-left justify-start px-6" onClick={handleUploadClick}>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm">{t('Upload New Photo', currentLanguage.code, 'ui')}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('Select from your device', currentLanguage.code, 'ui')}</span>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-16 rounded-2xl border-2 font-black gap-3 hover:bg-destructive/10 hover:border-destructive/20 text-destructive transition-all text-left justify-start px-6" onClick={handleRemovePhoto}>
                            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm">{t('Remove Current Photo', currentLanguage.code, 'ui')}</span>
                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{t('Restore default avatar', currentLanguage.code, 'ui')}</span>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px] border-2 shadow-2xl bg-card/95 backdrop-blur-xl">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-black tracking-tight">{t('Change Password', currentLanguage.code, 'ui')}</DialogTitle>
                        <DialogDescription className="font-bold text-muted-foreground/70">
                            {t('Enter your details below to update your password.', currentLanguage.code, 'ui')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('Current Password', currentLanguage.code, 'ui')}</label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-2 font-bold focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('New Password', currentLanguage.code, 'ui')}</label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-2 font-bold focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">{t('Confirm New Password', currentLanguage.code, 'ui')}</label>
                            <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-2 font-bold focus-visible:ring-primary" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsPasswordDialogOpen(false)} className="h-12 rounded-xl font-black">{t('Cancel', currentLanguage.code, 'ui')}</Button>
                        <Button className="h-12 px-8 rounded-xl font-black shadow-xl shadow-primary/20" onClick={() => setIsPasswordDialogOpen(false)}>
                            {t('Update Password', currentLanguage.code, 'ui')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
