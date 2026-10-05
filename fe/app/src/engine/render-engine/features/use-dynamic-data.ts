 
import { useState, useEffect, useCallback, useMemo } from "react";
import { type Definition } from "./types";
import { apiClient } from "../../library/api";
import { useRouteParams } from "@/platform/navigation";
import { reportError } from "@/platform/report";

// `:param` placeholders in action endpoints / queryParams resolve from
// the current route's params — so a detail page (/stays/:id) can declare
// "endpoint": "listing/:id" or queryParams {id: ":id"} and the engine
// fills them per route. Unmatched tokens pass through untouched.
const interpolate = (value: any, params: Record<string, any>): any => {
  if (typeof value === "string") {
    return value.replace(/:([a-zA-Z_]\w*)/g, (m, k) =>
      params[k] !== undefined ? String(params[k]) : m,
    );
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, interpolate(v, params)]),
    );
  }
  return value;
};

export function useDynamicData(def: Definition) {
  const routeParams = useRouteParams<Record<string, string>>();
  const [apiDataMap, setApiDataMap] = useState<Record<string, any>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [searchParameters, setSearchParameters] = useState<Record<string, any>>(
    {},
  );

  const isDynamic = def.properties.type === "dynamic";
  const actions = useMemo(
    () => (def.properties.action as any[]) || [],
    [def.properties.action],
  );

  // Skeleton only makes sense when there is an initial fetch to wait on —
  // a dynamic def with zero actions never triggers the effect that clears
  // this, so it must start false (was an infinite "Loading Component…").
  // `lazy: true` actions exist only for explicit action() calls (writes
  // like PUT/POST must never fire on mount) — they don't count for the
  // first-load skeleton or initial fetch batch.
  const autoActions = useMemo(
    () => actions.filter((a: any) => !a.lazy),
    [actions],
  );

  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(
    isDynamic && autoActions.length > 0,
  );
  const [firstLoadError, setFirstLoadError] = useState<string | null>(null);

  const anyLoading =
    isDynamic && autoActions.length > 0
      ? autoActions.some((a) => loadingMap[a.key] !== false)
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

      const { method, headers } = actionConfig;
      const paramsToUse = interpolate(
        paramsOverride !== undefined
          ? paramsOverride
          : searchParameters[actionKey],
        routeParams,
      );
      // Action data doubles as interpolation context — a lazy write
      // action like "revision/:rid" resolves :rid from the row the
      // component passed to action(), not just the URL params.
      const ctx = { ...routeParams, ...(paramsToUse || {}) };
      const endpoint = interpolate(actionConfig.endpoint, ctx);
      const payload = interpolate(actionConfig.payload, ctx);

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
        if (isInitialCall) {
          setFirstLoadError(msg);
          reportError(err, {
            source: `dynamic:${def.type}:${actionKey}`,
          });
        }
        return { error: true, message: msg, status_code: 500, data: null };
      } finally {
        setLoadingMap((prev) => ({ ...prev, [actionKey]: false }));
      }
    },
    [isDynamic, actions, searchParameters, routeParams, def.type],
  );

  const actionsKey = JSON.stringify(def.properties.action || []);
  const dynamicKey = `${def.properties.type}|${actionsKey}`;

  // Derived-from-def state moves via render-phase adjust; the effect
  // below only fires the async fetches.
  const [prevDynamicKey, setPrevDynamicKey] = useState(dynamicKey);
  if (dynamicKey !== prevDynamicKey) {
    setPrevDynamicKey(dynamicKey);
    if (isDynamic && actions.length > 0) {
      setSearchParameters((prev) => {
        let hasChanges = false;
        const merged = { ...prev };
        actions.forEach((a: any) => {
          if (!a.key) return;
          const incoming = a.queryParams || {};
          if (JSON.stringify(merged[a.key]) !== JSON.stringify(incoming)) {
            merged[a.key] = { ...merged[a.key], ...incoming };
            hasChanges = true;
          }
        });
        return hasChanges ? merged : prev;
      });
    } else {
      setIsFirstLoad(false);
    }
  }

  useEffect(() => {
    if (!(isDynamic && autoActions.length > 0)) return;

    // Trigger fetch for each non-lazy action — deferred to a microtask
    // so the synchronous setLoadingMap inside fetchDynamicData doesn't
    // run in the effect body.
    queueMicrotask(() => {
      const promises = autoActions.map((a: any) => {
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicKey]);

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
