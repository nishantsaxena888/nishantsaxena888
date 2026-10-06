"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/third-party-shadcn/combobox";
import { cn } from "@/lib/utils";
import { dynamicSelectStyles } from "./utils/dynamic-select-style";
import { useDynamicSelect } from "./hooks/use-dynamic-select";
import { Spinner } from "@/components/third-party-shadcn/spinner";

type Option = any;

type DynamicSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options?: Option[];
  placeholder?: string;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  themeName?: string;
  config?: {
    bindValue?: string;
    bindLabel?: string;
    endpoint?: string;
    method?: string;
    pageSize?: number;
    searchParam?: string;
    pageParam?: string;
    limitParam?: string;
    disabled?: boolean;
    readonly?: boolean;
    read_only?: boolean;
    readOnly?: boolean;
    hide?: boolean;
    hidden?: boolean;
  };
};

export const DynamicSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Search...",
  error,
  className,
  style,
  disabled,
  themeName = "default",
  config,
}: DynamicSelectProps) => {
  const appliedTheme =
    dynamicSelectStyles[themeName] || dynamicSelectStyles.default;

  const {
    inputValue,
    handleInputValueChange,
    handleValueChange,
    filteredOptions,
    labelKey,
    valueKey,
    loading,
    isSearching,
    setIsOpen,
    observerTarget,
  } = useDynamicSelect({
    value,
    options,
    onChange,
    config,
  });

  const isFieldDisabled =
    disabled ||
    config?.disabled === true ||
    config?.readonly === true ||
    config?.read_only === true ||
    config?.readOnly === true;

  return (
    <div className={cn("w-full", appliedTheme, className)} style={style}>
      <Combobox
        // Always controlled — entity values arrive async; undefined→string
        // flips trip the uncontrolled→controlled warning.
        value={value ?? ""}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        onOpenChange={setIsOpen}
      >
        <ComboboxInput
          placeholder={placeholder}
          disabled={isFieldDisabled}
          className={cn(
            // appliedTheme,
            "h-11 w-full px-3 py-2 rounded-lg text-sm app-input!",
            error && "border-red-400 bg-red-50 text-red-900",
            isFieldDisabled && "opacity-50 cursor-not-allowed h-11",
            // className,
          )}
          style={style}
        />
        <ComboboxContent>
          {filteredOptions?.length === 0 && !loading && (
            <ComboboxEmpty>No results found.</ComboboxEmpty>
          )}
          <ComboboxList>
            {isSearching && (
              <div className="flex items-center justify-center py-2 border-b border-slate-50">
                <Spinner className="w-4 h-4 text-indigo-500" />
              </div>
            )}
            {filteredOptions?.map((option, index) => {
              const optValue = String(option[valueKey]);
              const optLabel = String(option[labelKey]);
              // Using index in key to handle potential duplicate values during loading/mocking
              return (
                <ComboboxItem key={`${optValue}-${index}`} value={optValue}>
                  {optLabel}
                </ComboboxItem>
              );
            })}

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
