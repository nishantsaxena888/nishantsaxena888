import React from "react";
import { Anchor, Pressable } from "@/platform/primitives";
import { useNav } from "@/platform/navigation";
import { Button } from "@/components/third-party-shadcn/button";
import { Home, ArrowLeft, Ghost } from "lucide-react";

export const NotFound = () => {
  const { goBack } = useNav();
  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-2xl w-full px-6 text-center space-y-12">
        {/* Animated Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-background border border-border/50 p-8 rounded-3xl shadow-2xl backdrop-blur-sm group hover:scale-105 transition-transform duration-500">
            <Ghost className="h-24 w-24 text-primary animate-bounce" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-8xl font-black tracking-tighter text-foreground/10 select-none">
              404
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Lost in Space?
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page you are looking for has either drifted into another
            dimension or never existed in this reality.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 px-8 rounded-2xl font-bold gap-2 border-border/60 hover:bg-muted/50 transition-all active:scale-95"
          >
            <Pressable onPress={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Pressable>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-14 px-8 rounded-2xl font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Anchor to="/">
              <Home className="h-4 w-4" />
              Return Home
            </Anchor>
          </Button>
        </div>

        <div className="pt-12">
          <div className="flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Subtle branding or helper text */}
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
              System Status: Operational
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );
};
