import React from "react";
import { useFormStyleStore } from "@/store/use-form-style";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Settings2,
  RotateCcw,
  Palette,
  Layout,
  Type,
  Maximize,
  Sparkles,
  PanelLeft,
  Columns,
  Diamond,
  Zap,
  Leaf,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const FormStyleSettings = () => {
  const {
    styles,
    themeName,
    setStyles,
    setThemeName,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useFormStyleStore();

  const themes = [
    { id: "default", name: "Default", icon: <Diamond className="h-5 w-5" />, color: "bg-slate-900" },
    { id: "lightspeed", name: "Lightspeed", icon: <Zap className="h-5 w-5" />, color: "bg-blue-600" },
    { id: "clover", name: "Clover", icon: <Leaf className="h-5 w-5" />, color: "bg-emerald-600" },
    {
      id: "inventureAi",
      name: "Inventure",
      icon: <Sparkle className="h-5 w-5" />,
      color: "bg-indigo-600",
    },
  ];

  const parsePx = (val: string) => parseInt(val.replace("px", "")) || 0;

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <SheetContent
        side={styles.sidebarPosition === "right" ? "left" : "right"}
        className={cn(
          "w-full sm:w-[440px] p-0 bg-background/95 backdrop-blur-xl",
          styles.sidebarPosition === "right"
            ? "border-r border-border/50"
            : "border-l border-border/50",
        )}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-8 pb-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                UI Personalization
              </SheetTitle>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tailor the interface aesthetics to match your brand identity in
              real-time.
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* Theme Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Layout className="h-3.5 w-3.5" />
                <span>Base Architecture</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeName(t.id)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 transition-all duration-300",
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                        themeName === t.id
                          ? "border-primary bg-primary/10 scale-110 shadow-lg shadow-primary/20"
                          : "border-border/40 bg-muted/30 hover:border-border/60 hover:bg-muted/50",
                      )}
                    >
                      <div className="group-hover:scale-110 transition-transform text-foreground/80 group-hover:text-primary">
                        {t.icon}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                        themeName === t.id
                          ? "text-primary"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {t.name}
                    </span>
                    {themeName === t.id && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-in zoom-in duration-300" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Form Refinement */}
            <section className="space-y-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <Palette className="h-3.5 w-3.5" />
                <span>Input Surface Design</span>
              </div>

              <div className="space-y-6">
                {/* Field Height */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Maximize className="h-4 w-4 text-muted-foreground" />
                      Field Height
                    </Label>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded-md border border-border/50">
                      {styles.fieldHeight}
                    </span>
                  </div>
                  <Slider
                    value={[parsePx(styles.fieldHeight)]}
                    min={32}
                    max={64}
                    step={1}
                    onValueChange={([v]) =>
                      setStyles({ fieldHeight: `${v}px` })
                    }
                    className="py-4"
                  />
                </div>

                {/* Corner Curvature */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 rounded-tl-lg border-2 border-t-muted-foreground border-l-muted-foreground" />
                      Corner Curvature
                    </Label>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded-md border border-border/50">
                      {styles.fieldBorderRadius}
                    </span>
                  </div>
                  <Slider
                    value={[parsePx(styles.fieldBorderRadius)]}
                    min={0}
                    max={32}
                    step={1}
                    onValueChange={([v]) =>
                      setStyles({ fieldBorderRadius: `${v}px` })
                    }
                    className="py-4"
                  />
                </div>

                {/* Typography Scale */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      Typography Scale
                    </Label>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded-md border border-border/50">
                      {styles.fontSize}
                    </span>
                  </div>
                  <Slider
                    value={[parsePx(styles.fontSize)]}
                    min={11}
                    max={20}
                    step={1}
                    onValueChange={([v]) => setStyles({ fontSize: `${v}px` })}
                    className="py-4"
                  />
                </div>
              </div>
            </section>

            {/* Sidebar Personalization */}
            <section className="space-y-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                <PanelLeft className="h-3.5 w-3.5" />
                <span>Navigation Architecture</span>
              </div>

              <div className="space-y-6">
                {/* Variant */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Visual Variant
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["sidebar", "floating", "inset"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setStyles({ sidebarVariant: v as any })}
                        className={cn(
                          "px-2 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all",
                          styles.sidebarVariant === v
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Collapsible Mode
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["icon", "none", "offcanvas"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setStyles({ sidebarCollapsible: v as any })}
                        className={cn(
                          "px-2 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all",
                          styles.sidebarCollapsible === v
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sidebar Position
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["left", "right"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setStyles({ sidebarPosition: v as any })}
                        className={cn(
                          "px-2 py-2 rounded-xl border text-xs font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-2",
                          styles.sidebarPosition === v
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {v === "left" ? <PanelLeft className="h-3.5 w-3.5" /> : <Columns className="h-3.5 w-3.5 rotate-180" />}
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Color Identity */}
          </div>

          <div className="p-8 pt-6 border-t border-border/40 bg-muted/20">
            <Button
              className="w-full h-12 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/15 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => {
                setStyles({
                  fieldHeight: "44px",
                  fieldBorderRadius: "10px",
                  primaryColor: "hsl(var(--primary))",
                  fontSize: "14px",
                  sidebarVariant: "sidebar",
                  sidebarCollapsible: "offcanvas",
                  sidebarPosition: "left",
                });
                setThemeName("default");
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Restore Original State
            </Button>
            <div className="mt-4 text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Live Synchronization Enabled
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
