"use client";

import * as React from "react";
import { Check, ChevronDown, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { switcherStyles } from "./utils/switcher-style";
import { useConfigStore } from "@/store/use-config-store";

export function ThemeSwitcher({
  currentTheme,
  onThemeChange,
  className,
  themeName,
  triggerClassName,
  contentClassName,
  align = "end",
  sideOffset = 8,
}: {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  className?: string;
  themeName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  const [open, setOpen] = React.useState(false);

  // Theme options from backend "configuration" (config-driven, no mocks)
  const configThemes = useConfigStore((s: any) => s.config?.themes);
  const themes = (Array.isArray(configThemes) ? configThemes : []).map((t: any) => ({
    id: t.value,
    label: t.label || t.value,
  }));

  const appliedTheme = switcherStyles[themeName || "default"] || switcherStyles.default;

  const selectedTheme =
    themes.find((t) => t.id === currentTheme) || themes[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-10 xl:w-44 h-10 p-0 xl:px-3 text-xs border-none bg-muted/50 rounded-full xl:rounded-xl flex items-center justify-center xl:justify-start transition-all",
            appliedTheme,
            triggerClassName,
            className
          )}
        >
          <Palette className="h-4 w-4 xl:mr-2 text-primary shrink-0" />
          <span className="hidden xl:inline truncate font-semibold text-foreground">
            {selectedTheme?.label || "Select Theme"}
          </span>
          <ChevronDown className="hidden xl:inline h-3.5 w-3.5 ml-auto opacity-50 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[110] min-w-[200px] rounded-2xl border border-border/50 shadow-2xl p-2 bg-popover/95 backdrop-blur-md",
          contentClassName
        )}
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search theme..."
            className="h-9 text-xs border-none focus:ring-0 focus-visible:ring-0"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-2.5 text-center text-xs text-muted-foreground">
              No theme found.
            </CommandEmpty>

            <CommandGroup>
              {themes.map((theme) => (
                <CommandItem
                  key={theme.id}
                  value={theme.label}
                  onSelect={() => {
                    onThemeChange(theme.id);
                    setOpen(false);
                  }}
                  className="text-xs font-bold rounded-xl py-2.5 px-4 mb-1 last:mb-0 transition-colors flex items-center justify-between cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <span className="truncate">{theme.label}</span>

                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-primary transition-opacity",
                      currentTheme === theme.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
