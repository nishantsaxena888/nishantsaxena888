"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/third-party-shadcn/combobox";
import { cn } from "@/lib/utils";
type Option = {
  label: string;
  value: string;
};

type MultiSelectFieldProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

export const MultiSelectField = ({
  value,
  onChange,
  options = [],
  placeholder = "Select options",
  error,
  className,
  style,
  disabled,
}: MultiSelectFieldProps) => {
  const [internalValue, setInternalValue] = React.useState<string[]>(value || []);

  const [prevSyncedValue, setPrevSyncedValue] = React.useState(value);
  if (value !== undefined && value !== prevSyncedValue) {
    setPrevSyncedValue(value);
    setInternalValue(value);
  }

  const anchor = useComboboxAnchor();

  // map for label lookup
  const labelMap = Object.fromEntries(
    options.map((o) => [o.value, o.label])
  );

  const values = options.map((o) => o.value);

  return (
    <Combobox
      multiple
      items={values}
      value={internalValue}
      onValueChange={(val) => {
        setInternalValue(val as string[]);
        onChange?.(val as string[]);
      }}
      disabled={disabled}
    >
      {/* Chips */}
      <ComboboxChips
        ref={anchor}
        style={style}
        className={cn(
          "app-multi-select min-h-10 relative pr-8 w-full",
          error && "border-red-400 bg-red-50 focus-within:ring-red-500/20",
          className
        )}
      >
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.map((val) => (
                <ComboboxChip key={val} className="animate-in fade-in zoom-in duration-200">
                  {labelMap[val]}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput 
                placeholder={selected.length === 0 ? placeholder : ""} 
                className="text-sm bg-transparent"
              />
            </>
          )}
        </ComboboxValue>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </ComboboxChips>

      {/* Dropdown */}
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {labelMap[item]}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};