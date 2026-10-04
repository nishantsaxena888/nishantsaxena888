 
import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../library/api";
import { useGenericState } from "@/store/use-generic-state";
import { useConfigStore } from "@/store/use-config-store";
import { isRegisteredSession, getSessionMatchKey } from "../library/reducers";
import { currentRole, methodAllowed, type RbacSpec } from "../library/rbac";

const EMPTY_ARRAY: any[] = [];

export interface UseEntityOptions {
  id?: string | number;
  page?: number;
  itemPerPage?: number | string;
  sortBy?: string;
  orderBy?: "asc" | "desc";
  searchParameter?: Record<string, any>;
  search?: any;
  onMutationReload?: boolean;
  prefetch?: boolean;
  header?: Record<string, string>;
  disabledMethods?: ("get" | "post" | "put" | "patch" | "delete" | "options")[];
  // Per-call-site permission override (OPTIONS `content.rbac`, passed by
  // useCurdEntity). Falls back to configuration `rbac[entity]`. Spec is
  // the backend shape: {"read": "*", "write": ["admin","editor"]}.
  rbac?: RbacSpec;
}

export interface EntityReloadParams {
  page?: number;
  itemPerPage?: number | string;
  sortBy?: string;
  orderBy?: "asc" | "desc";
  searchParameter?: Record<string, any>;
  search?: any;
}

export function useEntity(entity: string, options?: UseEntityOptions) {
  // Extract and set configured defaults
  const {
    id = "",
    page = 1,
    itemPerPage = 10,
    sortBy = "",
    orderBy = "asc",
    searchParameter = {},
    search = "",
    onMutationReload = true,
    prefetch = true,
    header,
    disabledMethods = [],
    rbac,
  } = options || {};

  const isSession = isRegisteredSession(entity);

  // Implicit entity RBAC — the permission spec is data, not code:
  // `rbac` prop (typically OPTIONS content.rbac) wins, else the client's
  // configuration `rbac[entity]` map. Sessions stay ungated — they are
  // local state, and def-level `roles` already gates their rendering.
  const configRbac = useConfigStore(
    useCallback((s: any) => s.config?.rbac?.[entity], [entity]),
  );
  const role = currentRole(useConfigStore((s: any) => s.config));
  const rbacSpec = rbac !== undefined ? rbac : configRbac;
  // can("post") → is the current role allowed AND the method not disabled.
  // UI hides on this; the method bodies below also no-op on it so a missed
  // check still can't call (the backend remains the real boundary).
  const can = useCallback(
    (method: string) =>
      !disabledMethods.includes(method as any) &&
      methodAllowed(rbacSpec, role, method),
    [disabledMethods, rbacSpec, role],
  );

  // Subscribe reactively to the session state when it's a registered session
  const sessionData = useGenericState(
    useCallback((state: any) => state.data[entity] ?? EMPTY_ARRAY, [entity])
  );

  // Component Data States
  const [list, setList] = useState<any[]>([]);
  const [optionData, setOptionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSkeleton, setIsSkeleton] = useState<boolean>(!isSession);

  // Configuration States for Pagination and Queries
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentItemPerPage, setCurrentItemPerPage] = useState<number>(
    Number(itemPerPage) || 10,
  );
  const [currentSortBy, setCurrentSortBy] = useState<string>(sortBy);
  const [currentOrderBy, setCurrentOrderBy] = useState<"asc" | "desc">(orderBy);
  const [currentSearchParameter, setCurrentSearchParameter] =
    useState<Record<string, any>>(searchParameter);
  const [currentSearch, setCurrentSearch] = useState<any>(search);
  const [total, setTotal] = useState<number>(0);

  // Computed page calculation
  const pages = Math.max(1, Math.ceil(total / currentItemPerPage));

  // Consolidates configuration properties into standard API params
  const getApiParams = useCallback(
    (overrides: any = {}) => {
      return {
        page: overrides.page ?? currentPage,
        limit: overrides.limit ?? currentItemPerPage,
        sort_by: overrides.sort_by ?? currentSortBy,
        order_by: overrides.order_by ?? currentOrderBy,
        search: overrides.search ?? currentSearch,
        ...(overrides.searchParameter ?? currentSearchParameter),
      };
    },
    [
      currentPage,
      currentItemPerPage,
      currentSortBy,
      currentOrderBy,
      currentSearch,
      currentSearchParameter,
    ],
  );

  // Fetches data cleanly from API and applies internal state management
  const reload = useCallback(
    async (customConfig?: EntityReloadParams) => {
      if (isSession) {
        if (customConfig) {
          if (customConfig.page !== undefined) setCurrentPage(customConfig.page);
          if (customConfig.itemPerPage !== undefined)
            setCurrentItemPerPage(Number(customConfig.itemPerPage) || 10);
          if (customConfig.sortBy !== undefined) setCurrentSortBy(customConfig.sortBy);
          if (customConfig.orderBy !== undefined) setCurrentOrderBy(customConfig.orderBy);
          if (customConfig.searchParameter !== undefined)
            setCurrentSearchParameter(customConfig.searchParameter);
          if (customConfig.search !== undefined)
            setCurrentSearch(customConfig.search);
        }
        return { data: sessionData, error: false, status_code: 200, message: "Session data loaded" };
      }

      if (!can("get")) {
        setIsSkeleton(false);
        return { data: null, error: true, status_code: 403, message: "GET not permitted" };
      }
      setLoading(true);

      // Patch incoming configurations and sync them cleanly properly
      const finalPage =
        customConfig?.page !== undefined ? customConfig.page : currentPage;
      const finalLimit =
        customConfig?.itemPerPage !== undefined
          ? Number(customConfig.itemPerPage)
          : currentItemPerPage;
      const finalSort =
        customConfig?.sortBy !== undefined
          ? customConfig.sortBy
          : currentSortBy;
      const finalOrder = (
        customConfig?.orderBy !== undefined
          ? customConfig.orderBy
          : currentOrderBy
      ) as "asc" | "desc";
      const finalSearchParam =
        customConfig?.searchParameter !== undefined
          ? customConfig.searchParameter
          : currentSearchParameter;
      const finalSearchQuery =
        customConfig?.search !== undefined
          ? customConfig.search
          : currentSearch;

      if (customConfig) {
        if (customConfig.page !== undefined) setCurrentPage(finalPage);
        if (customConfig.itemPerPage !== undefined)
          setCurrentItemPerPage(finalLimit);
        if (customConfig.sortBy !== undefined) setCurrentSortBy(finalSort);
        if (customConfig.orderBy !== undefined) setCurrentOrderBy(finalOrder);
        if (customConfig.searchParameter !== undefined)
          setCurrentSearchParameter(finalSearchParam);
        if (customConfig.search !== undefined)
          setCurrentSearch(finalSearchQuery);
      }

      const payloadParams = getApiParams({
        page: finalPage,
        limit: finalLimit,
        sort_by: finalSort,
        order_by: finalOrder,
        searchParameter: finalSearchParam,
        search: finalSearchQuery,
      });

      try {
        const res = await apiClient(entity, {
          method: "get",
          id: id ? id : undefined,
          searchParameter: payloadParams,
          header,
        });

        if (!res.error) {
          // Evaluate the common nested object schemas returning array listings (e.g., res.data.data, res.data.items)
          const matchedList = Array.isArray(res.data)
            ? res.data
            : res.data?.data || res.data?.items || res.data || [];

          const matchedTotal =
            res.data?.total ??
            res.data?.total_count ??
            res.details?.total ??
            matchedList.length;

          setList(matchedList);
          setTotal(matchedTotal);
          setIsSkeleton(false);
        }
        return res;
      } finally {
        setLoading(false);
      }
    },
    [
      entity,
      id,
      header,
      can,
      currentPage,
      currentItemPerPage,
      currentSortBy,
      currentOrderBy,
      currentSearchParameter,
      currentSearch,
      getApiParams,
      isSession,
      sessionData,
    ],
  );

  const onOptions = useCallback(async () => {
    if (!can("options")) {
      return { data: null, error: true, status_code: 403, message: "OPTIONS not permitted" };
    }
    setLoading(true);
    try {
      const res = await apiClient(entity, {
        method: "options",
        header,
      });
      if (!res.error) {
        setOptionData(res.data);
      }
      return res;
    } finally {
      setLoading(false);
    }
  }, [entity, header, can]);

  // Initial Data Lifecycle (Optional hook effect trigger controlled organically by 'prefetch')
  useEffect(() => {
    if (prefetch && !isSession) {
      // onOptions/reload flip loading synchronously — defer the trigger a
      // microtask so no setState runs inside the effect body.
      queueMicrotask(() => {
        void onOptions();
        void reload();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetch, entity, id, isSession]);

  // Dynamically actionate custom operations
  const onAction = async ({
    type,
    data,
  }: {
    type:
      | "page"
      | "per_page_item"
      | "sort_by"
      | "order_by"
      | "searchParameter"
      | "search";
    data: any;
  }) => {
    const configUpdate: EntityReloadParams = {};

    switch (type) {
      case "page":
        configUpdate.page = data;
        break;
      case "per_page_item":
        configUpdate.itemPerPage = data;
        configUpdate.page = 1; // Reset to layout 1
        break;
      case "sort_by":
        configUpdate.sortBy = data;
        break;
      case "order_by":
        configUpdate.orderBy = data;
        break;
      case "searchParameter":
        configUpdate.searchParameter = data;
        configUpdate.page = 1; // Reset to layout 1
        break;
      case "search":
        configUpdate.search = data;
        configUpdate.page = 1; // Reset to layout 1
        break;
    }

    return await reload(configUpdate);
  };

  const onPost = async (payload: any) => {
    if (isSession) {
      useGenericState.getState().update(entity, payload);
      return { data: payload, error: false, status_code: 200, message: "Session updated" };
    }
    if (!can("post")) {
      return { data: null, error: true, status_code: 403, message: "POST not permitted" };
    }
    setLoading(true);
    try {
      const res = await apiClient(entity, {
        method: "post",
        payload,
        header,
      });
      if (onMutationReload && !res.error) {
        await reload();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (updateId: string | number, payload: any) => {
    if (isSession) {
      const matchKey = getSessionMatchKey(entity) || "id";
      useGenericState.getState().update(entity, { ...payload, [matchKey]: updateId });
      return { data: payload, error: false, status_code: 200, message: "Session updated" };
    }
    if (!can("put")) {
      return { data: null, error: true, status_code: 403, message: "PUT not permitted" };
    }
    setLoading(true);
    try {
      const res = await apiClient(entity, {
        method: "put",
        id: updateId,
        payload,
        header,
      });
      if (onMutationReload && !res.error) {
        await reload();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (deleteId: string | number) => {
    if (isSession) {
      useGenericState.getState().update(entity, { id: deleteId, _operation: "remove" });
      return { data: null, error: false, status_code: 200, message: "Session item removed" };
    }
    if (!can("delete")) {
      return { data: null, error: true, status_code: 403, message: "DELETE not permitted" };
    }
    setLoading(true);
    try {
      const res = await apiClient(entity, {
        method: "delete",
        id: deleteId,
        header,
      });
      if (onMutationReload && !res.error) {
        await reload();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    list: isSession ? sessionData : list,
    option: optionData,
    onOptions,
    onDelete,
    onUpdate,
    onPost,
    reload,
    onAction,
    can,
    role,
    loading,
    isSkeleton,
    config: {
      currentPage,
      itemPerPage: currentItemPerPage,
      sortBy: currentSortBy,
      orderBy: currentOrderBy,
      searchParameter: currentSearchParameter,
      search: currentSearch,
      total: isSession ? sessionData.length : total,
      pages: isSession ? Math.max(1, Math.ceil(sessionData.length / currentItemPerPage)) : pages,
    },
  };
}
