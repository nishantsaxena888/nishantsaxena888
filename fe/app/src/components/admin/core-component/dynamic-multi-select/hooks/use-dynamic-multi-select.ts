"use client";

import * as React from "react";
import { apiClient } from "@/engine/library/api";

type Option = {
  label: string;
  value: string;
  rawRecord?: any;
};

interface UseDynamicMultiSelectProps {
  value?: any[];
  options?: Option[]; // Static options
  onChange?: (value: string[]) => void;
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
}

export const useDynamicMultiSelect = ({
  value = [],
  options: staticOptions = [],
  onChange,
  control,
  config,
}: UseDynamicMultiSelectProps) => {
  const [apiOptions, setApiOptions] = React.useState<Option[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  const isTyping = React.useRef(false);
  const isMounted = React.useRef(false);
  const observerTarget = React.useRef<HTMLDivElement | null>(null);

  const {
    bindLabel = "name",
    bindValue = "id",
    endpoint,
    method = "GET",
    pageSize = 10,
    searchParam = "search",
    pageParam = "page",
    limitParam = "limit",
    dependsOn,
  } = config || {};

  // Read value of the parent field if dependsOn is defined — read fresh
  // each render so changes propagate without a memo dependency hack.
  const parentValue = dependsOn ? control?.getValue?.(dependsOn) : undefined;

  const fetchData = React.useCallback(
    async (
      searchQuery: string,
      pageNum: number,
      append: boolean = false,
      currentParentVal?: any
    ) => {
      if (!endpoint) return;

      // If dependsOn is specified but no parent value is set, do not fetch.
      // (The render-phase adjust below already cleared apiOptions/hasMore.)
      if (dependsOn && (currentParentVal === undefined || currentParentVal === null || currentParentVal === "")) {
        return;
      }

      // loading=true is set by callers — either render-phase adjusts
      // (effect-triggered loads) or async callbacks (search/scroll).
      try {
        const searchParameter: Record<string, any> = {
          [pageParam]: pageNum,
          [limitParam]: pageSize,
        };

        if (searchQuery) {
          searchParameter[searchParam] = searchQuery;
        }

        // Include parent field value if dependsOn is defined
        if (dependsOn && currentParentVal !== undefined && currentParentVal !== null && currentParentVal !== "") {
          if (Array.isArray(currentParentVal)) {
            searchParameter[dependsOn] = currentParentVal.join(",");
          } else {
            searchParameter[dependsOn] = String(currentParentVal);
          }
        }

        const response = await apiClient(endpoint, {
          method: method as any,
          searchParameter,
        });

        if (response && !response.error) {
          const rawData = response.data;
          const newData = Array.isArray(rawData)
            ? rawData
            : rawData && Array.isArray(rawData.data)
            ? rawData.data
            : [];

          const mappedOptions: Option[] = newData.map((item: any) => ({
            label: String(item[bindLabel] || item.name || item.label || ""),
            value: String(item[bindValue] || item.id || item.value || ""),
            rawRecord: item, // Store the raw item to support frontend filtering for Mock API fallback
          }));

          setApiOptions((prev) => (append ? [...prev, ...mappedOptions] : mappedOptions));
          setHasMore(newData.length === pageSize);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Failed to fetch dynamic multi-select options:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [endpoint, method, pageSize, searchParam, pageParam, limitParam, dependsOn, bindLabel, bindValue]
  );

  // Reset page/list and arm loading when parentValue changes —
  // render-phase adjust so the effect below stays async-only.
  const [prevParentValue, setPrevParentValue] = React.useState(parentValue);
  if (parentValue !== prevParentValue) {
    setPrevParentValue(parentValue);
    setPage(1);
    setApiOptions([]);
    const emptyParent =
      dependsOn &&
      (parentValue === undefined || parentValue === null || parentValue === "");
    setHasMore(!emptyParent);
    if (endpoint && !emptyParent) setLoading(true);
  }

  // Initial load or parent value changed load
  React.useEffect(() => {
    if (!endpoint) return;

    // Defer so no setState runs synchronously in the effect body.
    queueMicrotask(() => {
      // Clear child value if parent changes to avoid invalid submissions (only after initial mount)
      if (dependsOn && isMounted.current) {
        onChange?.([]);
      }
      void fetchData("", 1, false, parentValue);
      isMounted.current = true;
    });
  }, [parentValue, endpoint, dependsOn, fetchData, onChange]);

  // Opening the dropdown arms loading in a render-phase adjust...
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && !dependsOn && endpoint && apiOptions.length === 0) {
      setLoading(true);
    }
  }

  // ...and the effect performs the fetch.
  React.useEffect(() => {
    if (!endpoint || dependsOn) return; // For dependent fields, handled by parentValue effect

    if (isOpen && apiOptions.length === 0) {
      queueMicrotask(() => void fetchData("", 1));
    }
  }, [isOpen, endpoint, apiOptions.length, dependsOn, fetchData]);

  // Debounced search
  React.useEffect(() => {
    if (!endpoint || !isTyping.current) return;

    const timer = setTimeout(() => {
      setPage(1);
      setIsSearching(true);
      setLoading(true);
      void fetchData(inputValue, 1, false, parentValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, endpoint, fetchData, parentValue]);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!hasMore || loading || !endpoint) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          setLoading(true);
          void fetchData(inputValue, nextPage, true, parentValue);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, endpoint, fetchData, inputValue, parentValue]);

  const handleInputValueChange = (val: string) => {
    setInputValue(val);
    isTyping.current = true;
  };

  const handleValueChange = (newVals: string[]) => {
    isTyping.current = false;
    onChange?.(newVals);
    setInputValue(""); // Clear input text when item selected
  };

  // Extract static/initial label and value pairs from selected items
  const extractedValueOptions = React.useMemo(() => {
    if (!value || !Array.isArray(value)) return [];
    const extracted: Option[] = [];
    value.forEach((item: any) => {
      if (typeof item === "object" && item !== null) {
        const labelVal = String(item[bindLabel] || item.name || item.label || "");
        const idVal = item[bindValue] || item.id || item.value;
        if (labelVal && idVal !== undefined && idVal !== null) {
          extracted.push({
            label: labelVal,
            value: String(idVal),
          });
        }
      }
    });
    return extracted;
  }, [value, bindLabel, bindValue]);

  // Merge static options, api loaded options, and value-extracted options
  const allMergedOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const merged: Option[] = [];

    // 1. Static options
    (staticOptions || []).forEach((opt) => {
      const valStr = String(opt.value);
      if (!seen.has(valStr)) {
        seen.add(valStr);
        merged.push({ label: opt.label, value: valStr });
      }
    });

    // 2. Extracted options from value prop (to display labels for already selected options)
    extractedValueOptions.forEach((opt) => {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        merged.push(opt);
      }
    });

    // 3. API loaded options
    apiOptions.forEach((opt) => {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        merged.push(opt);
      }
    });

    return merged;
  }, [staticOptions, extractedValueOptions, apiOptions]);

  // Filter and map option values for dropdown displaying (includes frontend searching and parent filtering fallback)
  const filteredOptionValues = React.useMemo(() => {
    let list = allMergedOptions;

    // A. Filter by dependsOn field if specified (Frontend fallback for static mock APIs)
    if (dependsOn && parentValue !== undefined && parentValue !== null && parentValue !== "") {
      const parentVals = Array.isArray(parentValue)
        ? parentValue.map((v) => String(v))
        : [String(parentValue)];

      list = list.filter((o) => {
        const optionParentVal = o.rawRecord?.[dependsOn];
        if (optionParentVal !== undefined && optionParentVal !== null) {
          return parentVals.includes(String(optionParentVal));
        }
        return true;
      });
    }

    // B. Filter by local search query (Frontend search fallback)
    if (inputValue) {
      const searchLower = inputValue.toLowerCase();
      list = list.filter((o) => o.label.toLowerCase().includes(searchLower));
    }

    return list.map((o) => o.value);
  }, [allMergedOptions, inputValue, dependsOn, parentValue]);

  // Convert rich selected values into clean string key arrays for Combobox primitive
  const normalizedValue = React.useMemo(() => {
    if (!value || !Array.isArray(value)) return [];
    return value.map((item: any) => {
      if (typeof item === "object" && item !== null) {
        const idVal = item[bindValue] || item.id || item.value;
        if (idVal !== undefined && idVal !== null && idVal !== "") {
          return String(idVal);
        }

        const matched = allMergedOptions.find((opt) => {
          const optLabelLower = opt.label.toLowerCase();
          return (
            (item.name && optLabelLower === item.name.toLowerCase()) ||
            (item.entity && optLabelLower === item.entity.toLowerCase())
          );
        });

        if (matched) return String(matched.value);
        return String(item.name || item.entity || "").toLowerCase();
      }
      return String(item);
    });
  }, [value, bindValue, allMergedOptions]);

  const isFieldDisabled =
    dependsOn &&
    (parentValue === undefined ||
      parentValue === null ||
      parentValue === "" ||
      (Array.isArray(parentValue) && parentValue.length === 0));

  return {
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
    dependsOnFieldName: dependsOn,
    parentValue,
  };
};
