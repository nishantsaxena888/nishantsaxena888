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
  
  // isTyping is read during render (label-sync adjust below), so it must
  // be state, not a ref — ref reads in render are not allowed.
  const [isTyping, setIsTyping] = React.useState(false);
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

    // loading=true is set by callers — render-phase adjusts for
    // effect-triggered loads, async callbacks for search/scroll.
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

  // Initial load: either if open, OR if a value exists but we don't have
  // its option loaded yet. Loading flag moves via render-phase adjust;
  // the effect only fires the async call.
  const hasValue = value !== undefined && value !== null && value !== "";
  const hasLoadedOption =
    hasValue &&
    internalOptions.some((opt) => String(opt[valueKey]) === String(value));
  const needInitialLoad =
    Boolean(endpoint) &&
    internalOptions.length === 0 &&
    (isOpen || (hasValue && !hasLoadedOption));

  const [prevNeedInitialLoad, setPrevNeedInitialLoad] = React.useState(needInitialLoad);
  if (needInitialLoad !== prevNeedInitialLoad) {
    setPrevNeedInitialLoad(needInitialLoad);
    if (needInitialLoad) setLoading(true);
  }

  React.useEffect(() => {
    if (needInitialLoad) {
      // Defer so no setState runs synchronously in the effect body.
      queueMicrotask(() => void fetchData("", 1));
    }
  }, [needInitialLoad, fetchData]);

  // Debounced search
  React.useEffect(() => {
    if (!endpoint || !isTyping) return;

    const timer = setTimeout(() => {
      setPage(1);
      setIsSearching(true);
      setLoading(true);
      void fetchData(inputValue, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, endpoint, isTyping, fetchData]);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!hasMore || loading || !endpoint) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          setLoading(true);
          void fetchData(inputValue, nextPage, true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, endpoint, fetchData, inputValue]);

  // Sync input value with selected option label — render-phase adjust.
  const selectedLabel = value
    ? [...(staticOptions || []), ...(internalOptions || [])].find(
        (opt) => String(opt[valueKey]) === String(value)
      )?.[labelKey]
    : undefined;
  const [prevSelectedLabel, setPrevSelectedLabel] = React.useState(selectedLabel);
  if (selectedLabel !== prevSelectedLabel) {
    setPrevSelectedLabel(selectedLabel);
    if (selectedLabel !== undefined && !isTyping) {
      setInputValue(selectedLabel);
    }
  }

  const handleInputValueChange = (val: string) => {
    if (!isTyping) {
      const allOptions = [...(staticOptions || []), ...(internalOptions || [])];
      const isValueNotLabel = allOptions.some(
        (opt) =>
          String(opt[valueKey]) === String(val) &&
          String(opt[labelKey]) !== String(val)
      );
      if (isValueNotLabel) return;
    }

    setInputValue(val);
    setIsTyping(true);
  };

  const handleValueChange = (val: string | null) => {
    setIsTyping(false);
    onChange?.(val as string);
    const allOptions = [...(staticOptions || []), ...(internalOptions || [])];
    const selectedOption = allOptions.find(
      (opt) => String(opt[valueKey]) === String(val)
    );
    if (selectedOption) {
      setInputValue(selectedOption[labelKey]);
    }
  };

  const filteredOptions = React.useMemo(() => {
    const finalOptions = (endpoint ? internalOptions : staticOptions) || [];
    if (endpoint) return finalOptions; // API handles filtering
    if (!inputValue) return finalOptions;

    return finalOptions.filter((option) =>
      String(option[labelKey])
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
  }, [internalOptions, staticOptions, inputValue, labelKey, endpoint]);

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
