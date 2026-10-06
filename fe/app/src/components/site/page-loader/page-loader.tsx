import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

export const PageLoader = ({ 
  className, 
  label = "Loading your experience...", 
  fullScreen = true 
}: PageLoaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-md" : "w-full py-12",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
        
        {/* Main Spinner */}
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-[spin_1.5s_linear_infinite]" />
          
          {/* Inner Accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-ping" />
        </div>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-foreground/70 animate-pulse">
            {label}
          </p>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
};
