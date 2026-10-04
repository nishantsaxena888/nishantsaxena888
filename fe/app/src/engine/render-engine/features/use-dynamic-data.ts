/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { type Definition } from "./types";
import { apiClient } from "../../library/api";

export function useDynamicData(def: Definition) {
  const [apiDataMap, setApiDataMap] = useState<Record<string, any>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [searchParameters, setSearchParameters] = useState<Record<string, any>>(
    {},
  );

  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(
    def.properties.type === "dynamic",
  );
  const [firstLoadError, setFirstLoadError] = useState<string | null>(null);

  const isDynamic = def.properties.type === "dynamic";
  const actions = (def.properties.action as any[]) || [];

  const anyLoading =
    isDynamic && actions.length > 0
      ? actions.some((a) => loadingMap[a.key] !== false)
      : false;

  const skeletonLoading = isFirstLoad;
  const loading = anyLoading;
  const error = Object.values(errorMap).find((e) => e) || null;

  const fetchDynamicData = useCallback(
    async (actionKey: string, paramsOverride?: any, isInitialCall = false) => {
      if (!isDynamic) return null;

      const actionConfig = actions.find((a: any) => a.key === actionKey);
      if (!actionConfig || !actionConfig.endpoint) {
        const msg = "No endpoint provided for action: " + actionKey;
        setErrorMap((prev) => ({ ...prev, [actionKey]: msg }));
        if (isInitialCall) setFirstLoadError(msg);
        setLoadingMap((prev) => ({ ...prev, [actionKey]: false }));
        return { error: true, message: msg, status_code: 400, data: null };
      }

      const { endpoint, method, payload, headers } = actionConfig;
      const paramsToUse =
        paramsOverride !== undefined
          ? paramsOverride
          : searchParameters[actionKey];

      setLoadingMap((prev) => ({ ...prev, [actionKey]: true }));
      setErrorMap((prev) => {
        const newMap = { ...prev };
        delete newMap[actionKey];
        return newMap;
      });

      try {
        const isFullUrl = endpoint?.startsWith("http") || false;
        const response = await apiClient(endpoint, {
          method: ((method as string)?.toLowerCase() as any) || "get",
          searchParameter: paramsToUse,
          payload: payload,
          header: headers,
          preFix: isFullUrl ? "" : undefined,
        });

        if (response.error) {
          const msg = response.message || "Error fetching data";
          setErrorMap((prev) => ({ ...prev, [actionKey]: msg }));
          if (isInitialCall) setFirstLoadError(msg);
        } else {
          setApiDataMap((prev) => ({ ...prev, [actionKey]: response.data }));
        }
        return response;
      } catch (err: any) {
        const msg = err.message || "Unknown error occurred";
        setErrorMap((prev) => ({ ...prev, [actionKey]: msg }));
        if (isInitialCall) setFirstLoadError(msg);
        return { error: true, message: msg, status_code: 500, data: null };
      } finally {
        setLoadingMap((prev) => ({ ...prev, [actionKey]: false }));
      }
    },
    [isDynamic, actions, searchParameters],
  );

  const actionsKey = JSON.stringify(def.properties.action || []);

  useEffect(() => {
    if (isDynamic && actions.length > 0) {
      const newSearchParams: Record<string, any> = {};
      actions.forEach((a: any) => {
        if (a.key) {
          newSearchParams[a.key] = a.queryParams || {};
        }
      });

      setSearchParameters((prev) => {
        let hasChanges = false;
        const merged = { ...prev };
        Object.keys(newSearchParams).forEach((key) => {
          if (JSON.stringify(merged[key]) !== JSON.stringify(newSearchParams[key])) {
            merged[key] = { ...merged[key], ...newSearchParams[key] };
            hasChanges = true;
          }
        });
        return hasChanges ? merged : prev;
      });

      // Trigger fetch for each action
      const promises = actions.map((a: any) => {
        if (a.key) {
          const params = {
            ...(searchParameters[a.key] || {}),
            ...(a.queryParams || {}),
          };
          return fetchDynamicData(a.key, params, true); // true = initial call
        }
        return Promise.resolve();
      });

      Promise.all(promises).then(() => {
        setIsFirstLoad(false);
      });
    } else {
      setIsFirstLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.properties.type, actionsKey]);

  const actionHandler = async ({
    key,
    type,
    data,
  }: {
    key: string;
    type: "reload" | "filter" | "search";
    data: any;
  }) => {
    if (!key) return null;

    let updatedParams = { ...(searchParameters[key] || {}) };
    if (type === "reload") {
      // Keep existing params
    } else if (type === "filter" || type === "search") {
      updatedParams = { ...updatedParams, ...data };
      setSearchParameters((prev) => ({ ...prev, [key]: updatedParams }));
    }

    return await fetchDynamicData(key, updatedParams, false);
  };

  return {
    apiData: apiDataMap,
    loading,
    skeletonLoading,
    error,
    firstLoadError,
    action: actionHandler,
    searchParameters,
  };
}
