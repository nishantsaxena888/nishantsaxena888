"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { inputStyles, listStyles } from "./utils/input-style";

export type SearchAutocompleteProps<T> = {
  data?: T[];
  onSelect?: (item: T) => void;
  onChange?: (value: string) => void;
  onFetch?: (query: string) => Promise<T[]>;
  debounceMs?: number;
  labelKey?: keyof T;
  valueKey?: keyof T;
  themeName?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="font-bold text-primary underline decoration-primary/30 underline-offset-2">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export function SearchAutocomplete<T extends string | object>({
  data = [],
  onSelect,
  onChange,
  onFetch,
  debounceMs = 300,
  labelKey,
  valueKey,
  themeName = "default",
  placeholder = "Search...",
  disabled,
  className,
}: SearchAutocompleteProps<T>) {
  const [query, setQuery] = React.useState("");
  const [fetched, setFetched] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const appliedInputTheme = inputStyles[themeName] || inputStyles.default;
  const appliedListTheme = listStyles[themeName] || listStyles.default;

  const getLabel = React.useCallback((item: T): string => {
    if (typeof item === "string") return item;
    if (labelKey && typeof item === "object" && item !== null) {
      return (item as any)[labelKey] || "";
    }
    return JSON.stringify(item);
  }, [labelKey]);

  const getValue = React.useCallback((item: T): string => {
    if (typeof item === "string") return item;
    if (valueKey && typeof item === "object" && item !== null) {
      return (item as any)[valueKey] || "";
    }
    return getLabel(item);
  }, [valueKey, getLabel]);

  // Static mode: suggestions derive from data+query — no state to sync.
  // Fetch mode: raw results live in `fetched`; an empty query reads as [].
  const suggestions = React.useMemo(() => {
    if (onFetch) return query.trim() === "" ? [] : fetched;
    return data.filter((item) =>
      getLabel(item).toLowerCase().includes(query.toLowerCase())
    );
  }, [onFetch, fetched, data, query, getLabel]);

  // Arm the spinner the moment a fetch-worthy query appears —
  // render-phase adjust; the async callback clears it.
  const wantFetch = Boolean(onFetch && query.trim() !== "");
  const [prevWantFetch, setPrevWantFetch] = React.useState(wantFetch);
  if (wantFetch !== prevWantFetch) {
    setPrevWantFetch(wantFetch);
    if (wantFetch) setIsLoading(true);
  }

  React.useEffect(() => {
    if (!onFetch || query.trim() === "") return;

    const timer = setTimeout(async () => {
      try {
        const results = await onFetch(query);
        setFetched(results);
      } catch (error) {
        console.error("Failed to fetch autocomplete results:", error);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onFetch, debounceMs]);

  return (
    <div className={cn("relative w-full", className)}>
      <Combobox
        open={open}
        onOpenChange={setOpen}
        inputValue={query}
        onInputValueChange={(val) => {
          setQuery(val);
          onChange?.(val);
          if (val.length > 0) setOpen(true);
        }}
        onValueChange={(val) => {
          const selected = suggestions.find((s) => getValue(s) === val);
          if (selected) {
            onSelect?.(selected);
            setQuery(getLabel(selected));
          }
        }}
      >
        <div className="relative group flex w-full">
          <ComboboxInput
            placeholder={placeholder}
            disabled={disabled}
            showTrigger={false}
            className={cn(
              appliedInputTheme,
              "w-full [&_input]:pl-10 [&_input]:pr-10" // Padding for search icon and loader/clear on inner input
            )}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && !isLoading && (
              <button suppressHydrationWarning
                type="button"
                onClick={() => {
                  setQuery("");
                  onChange?.("");
                }}
                className="hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <ComboboxContent className={cn("w-full mt-2 z-50", appliedListTheme)}>
          <ComboboxList className="max-h-60 overflow-y-auto p-1">
            {suggestions.map((item, index) => (
              <ComboboxItem
                key={index}
                value={getValue(item)}
                className="cursor-pointer transition-colors"
              >
                <Highlight text={getLabel(item)} highlight={query} />
              </ComboboxItem>
            ))}
            {suggestions.length === 0 && !isLoading && query && (
              <ComboboxEmpty className="py-2 text-sm text-center text-muted-foreground">
                No results found for "{query}"
              </ComboboxEmpty>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
