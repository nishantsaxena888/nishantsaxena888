"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface IframeProps {
  src?: string;
  title: string;
  width?: string | number;
  height?: string | number;
  aspectRatio?: "16/9" | "4/3" | "square" | "video" | "auto" | string;
  allowFullScreen?: boolean;
  sandbox?: string;
  className?: string;
  loading?: "lazy" | "eager";
  referrerPolicy?: ReferrerPolicy;
  fallbackText?: string;
}

export const Iframe = ({
  src,
  title,
  width = "100%",
  height = "450px",
  aspectRatio = "auto",
  allowFullScreen = true,
  sandbox = "allow-scripts allow-same-origin allow-forms allow-popups",
  className,
  loading = "lazy",
  referrerPolicy = "no-referrer-when-downgrade",
  fallbackText = "Could not load the content.",
}: IframeProps) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const containerStyle = "app-iframe w-full h-full rounded-lg overflow-hidden";
  const skeletonStyle = "app-iframe-loader absolute inset-0";

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // If no src is provided, show placeholder
  if (!src) {
    return (
      <div 
        className={cn(containerStyle, "flex flex-col items-center justify-center p-12 text-center", className)}
        style={{ width, height: aspectRatio === "auto" ? height : "auto", aspectRatio }}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ExternalLink className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">No source URL provided</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative", containerStyle, className)}
      style={{ width, height: aspectRatio === "auto" ? height : "auto", aspectRatio }}
    >
      {isLoading && (
        <div className={cn("absolute inset-0 z-10 flex flex-col items-center justify-center gap-3", skeletonStyle)}>
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <span className="text-xs font-medium text-slate-500 tracking-tight">Loading content...</span>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-sm font-semibold text-slate-900">{fallbackText}</p>
          <button suppressHydrationWarning 
            onClick={() => { setHasError(false); setIsLoading(true); }}
            className="mt-4 text-xs font-bold text-primary hover:underline"
          >
            Try reloading
          </button>
        </div>
      ) : (
        <iframe
          src={src}
          title={title}
          width="100%"
          height="100%"
          onLoad={handleLoad}
          onError={handleError}
          allowFullScreen={allowFullScreen}
          sandbox={sandbox}
          loading={loading}
          referrerPolicy={referrerPolicy}
          className="w-full h-full border-none"
        />
      )}
    </div>
  );
};
