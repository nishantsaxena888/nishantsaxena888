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
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { multiSelectStyles } from "../multi-select/utils/multi-select-style";
import { useDynamicMultiSelect } from "./hooks/use-dynamic-multi-select";
import { Spinner } from "@/components/ui/spinner";

type Option = {
  label: string;
  value: string;
};

type DynamicMultiSelectProps = {
  value?: any[];
  onChange?: (value: string[]) => void;
  options?: Option[];
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  themeName?: string;
  control?: any;
  config?: {
    bindValue?: string;
    bindLabel?: string;
    endpoint?: string;
    method?: string;
    pageSize?: number;
    searchParam?: string;
    pageParam?: string;
    limitParam?: string;
    dependsOn?: string;
  };
};

export const DynamicMultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = "Select options...",
  error,
  className,
  style,
  disabled,
  themeName = "default",
  control,
  config,
}: DynamicMultiSelectProps) => {
  const anchor = useComboboxAnchor();
  const appliedTheme = multiSelectStyles[themeName] || multiSelectStyles.default;

  const {
    inputValue,
    handleInputValueChange,
    handleValueChange,
    allMergedOptions,
    filteredOptionValues,
    normalizedValue,
    loading,
    isSearching,
    setIsOpen,
    observerTarget,
    isFieldDisabled,
    dependsOnFieldName,
  } = useDynamicMultiSelect({
    value,
    options,
    onChange,
    control,
    config,
  });

  const labelMap = React.useMemo(() => {
    return Object.fromEntries(allMergedOptions.map((o) => [o.value, o.label]));
  }, [allMergedOptions]);

  const allOptionValues = React.useMemo(() => {
    return allMergedOptions.map((o) => o.value);
  }, [allMergedOptions]);

  const finalDisabled = Boolean(disabled || isFieldDisabled);

  const computedPlaceholder = isFieldDisabled
    ? `Select ${dependsOnFieldName ? dependsOnFieldName.replace(/_id$/, "").replace(/-/g, " ") : "parent"} first...`
    : loading && allMergedOptions.length === 0
      ? "Loading..."
      : placeholder;

  return (
    <div className="w-full relative">
      <Combobox
        multiple
        items={allOptionValues}
        value={normalizedValue}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        onOpenChange={setIsOpen}
        disabled={finalDisabled}
      >
        {/* Chips & Input Container */}
        <ComboboxChips
          ref={anchor}
          style={style}
          className={cn(
            "min-h-11",
            appliedTheme,
            error && "border-red-400 bg-red-50",
            finalDisabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map((val) => (
                  <ComboboxChip key={val}>
                    {labelMap[val] || val}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  placeholder={computedPlaceholder}
                  disabled={finalDisabled}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>

        {/* Dropdown Content */}
        <ComboboxContent anchor={anchor}>
          {filteredOptionValues.length === 0 && !loading && (
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          )}

          <ComboboxList>
            {isSearching && (
              <div className="flex items-center justify-center py-2 border-b border-slate-50">
                <Spinner className="w-4 h-4 text-indigo-500" />
              </div>
            )}

            {filteredOptionValues.map((item) => (
              <ComboboxItem key={item} value={item}>
                {labelMap[item] || item}
              </ComboboxItem>
            ))}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="h-1" />

            {loading && (
              <div className="flex items-center justify-center py-2">
                <Spinner className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
