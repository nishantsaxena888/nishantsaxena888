"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SharedBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "success" | "warning" | "neutral";
  children: React.ReactNode;
}

export function SharedBadge({
  className,
  variant = "default",
  children,
  ...props
}: SharedBadgeProps) {
  // Map our custom variants to semantic classes defined in globals.css
  const variantClassMap: Record<string, string> = {
    success: "app-badge-success",
    warning: "app-badge-warning",
    neutral: "app-badge-neutral",
    default: "app-badge-default",
    secondary: "app-badge-secondary",
    destructive: "app-badge-destructive",
    outline: "app-badge-outline",
    ghost: "app-badge-ghost",
    link: "app-badge-link",
  };

  const semanticClass = variantClassMap[variant] || "app-badge-default";

  return (
    <Badge
      variant="outline" // Always use outline or default underneath so it doesn't fight our semantic CSS
      className={cn("app-badge", semanticClass, className)}
      {...props}
    >
      {children}
    </Badge>
  );
}
