import React, { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/third-party-shadcn/button";

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const statusCode = error?.status_code || 500;
  const message =
    error?.message || "An unexpected error occurred while loading the page.";
  const details = error?.details;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-[98%] w-full bg-background border-2 border-destructive/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-destructive/5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <ShieldAlert className="w-64 h-64 -mr-20 -mt-20" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-destructive/60 mb-1">
                Error Status: {statusCode}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Oops! Something went wrong.
              </h2>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-muted/50 border border-border/50">
            <p className="text-muted-foreground font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {details && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                Technical Details
              </button>

              {showDetails && (
                <div className="relative group">
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 text-[10px] font-mono overflow-auto max-h-48 border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
                    {typeof details === "string"
                      ? details
                      : JSON.stringify(details, null, 2)}
                  </pre>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] bg-white/10 px-2 py-1 rounded-md text-white uppercase tracking-widest">
                      Raw Output
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex items-center gap-4">
            <Button
              onClick={() => window.location.reload()}
              className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </Button>
            {onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="h-12 px-6 rounded-xl font-bold transition-all active:scale-95"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
