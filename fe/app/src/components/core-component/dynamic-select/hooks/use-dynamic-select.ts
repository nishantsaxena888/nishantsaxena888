"use client";

import * as React from "react";
import { apiClient } from "@/engine/library/api";

type Option = any;

interface UseDynamicSelectProps {
  value?: string;
  options?: Option[]; // Static options
  onChange?: (value: string) => void;
  config?: {
    bindValue?: string;
    bindLabel?: string;
    endpoint?: string;
    method?: string;
    pageSize?: number;
    searchParam?: string;
    pageParam?: string;
    limitParam?: string;
  };
}

export const useDynamicSelect = ({
  value,
  options: staticOptions = [],
  onChange,
  config,
}: UseDynamicSelectProps) => {
  const [internalOptions, setInternalOptions] = React.useState<Option[]>(staticOptions);
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  
  const isTyping = React.useRef(false);
  const observerTarget = React.useRef<HTMLDivElement | null>(null);

  const {
    bindLabel: labelKey = "label",
    bindValue: valueKey = "value",
    endpoint,
    method = "get",
    pageSize = 10,
    searchParam = "search",
    pageParam = "page",
    limitParam = "limit",
  } = config || {};

  const fetchData = React.useCallback(async (searchQuery: string, pageNum: number, append: boolean = false) => {
    if (!endpoint) return;

    setLoading(true);
    try {
      const searchParameter: Record<string, any> = {
        [pageParam]: pageNum,
        [limitParam]: pageSize,
      };
      
      if (searchQuery) {
        searchParameter[searchParam] = searchQuery;
      }

      const response = await apiClient(endpoint, {
        method: method as any,
        searchParameter,
      });

      if (response && !response.error) {
        // Handle both direct array responses and wrapped responses (response.data.data)
        const rawData = response.data;
        const newData = Array.isArray(rawData) 
          ? rawData 
          : (rawData && Array.isArray(rawData.data) ? rawData.data : []);
          
        setInternalOptions(prev => append ? [...prev, ...newData] : newData);
        setHasMore(newData.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch dynamic options:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [endpoint, method, pageSize, searchParam, pageParam, limitParam]);

  // Initial load: either if open, OR if a value exists but we don't have its option loaded yet
  React.useEffect(() => {
    if (!endpoint) return;

    const hasValue = value !== undefined && value !== null && value !== "";
    const hasLoadedOption = hasValue && internalOptions.some(
      (opt) => String(opt[valueKey]) === String(value)
    );

    // Fetch if:
    // 1. Dropdown is open and options are not loaded yet
    // 2. Or, a value is set but we haven't loaded its option to resolve the label
    if ((isOpen || (hasValue && !hasLoadedOption)) && internalOptions.length === 0) {
      fetchData("", 1);
    }
  }, [isOpen, endpoint, fetchData, internalOptions.length, value, valueKey]);

  // Debounced search
  React.useEffect(() => {
    if (!endpoint || !isTyping.current) return;

    const timer = setTimeout(() => {
      setPage(1);
      setIsSearching(true);
      fetchData(inputValue, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, endpoint, fetchData]);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!hasMore || loading || !endpoint) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(inputValue, nextPage, true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, endpoint, fetchData, inputValue]);

  // Sync input value with selected option label
  React.useEffect(() => {
    if (value && !isTyping.current) {
      const allOptions = [...(staticOptions || []), ...(internalOptions || [])];
      const selectedOption = allOptions.find(
        (opt) => String(opt[valueKey]) === String(value)
      );
      if (selectedOption) {
        setInputValue(selectedOption[labelKey]);
      }
    }
  }, [value, staticOptions, internalOptions, labelKey, valueKey]);

  const handleInputValueChange = (val: string) => {
    if (!isTyping.current) {
      const allOptions = [...(staticOptions || []), ...(internalOptions || [])];
      const isValueNotLabel = allOptions.some(
        (opt) =>
          String(opt[valueKey]) === String(val) &&
          String(opt[labelKey]) !== String(val)
      );
      if (isValueNotLabel) return;
    }

    setInputValue(val);
    isTyping.current = true;
  };

  const handleValueChange = (val: string | null) => {
    isTyping.current = false;
    onChange?.(val as string);
    const allOptions = [...(staticOptions || []), ...(internalOptions || [])];
    const selectedOption = allOptions.find(
      (opt) => String(opt[valueKey]) === String(val)
    );
    if (selectedOption) {
      setInputValue(selectedOption[labelKey]);
    }
  };

  const finalOptions = (endpoint ? internalOptions : staticOptions) || [];
  
  const filteredOptions = React.useMemo(() => {
    if (endpoint) return finalOptions; // API handles filtering
    if (!inputValue) return finalOptions;

    return finalOptions.filter((option) =>
      String(option[labelKey])
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
  }, [finalOptions, inputValue, labelKey, endpoint]);

  return {
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
  };
};
