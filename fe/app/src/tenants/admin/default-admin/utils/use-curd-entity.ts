import { useEntity } from "@/engine";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useProcess } from "@/store/use-process";
import { useState, useEffect } from "react";

export const useCurdEntity = ({ config: extra, content }: any) => {
  const entity = extra?.activePage?.entity;
  const table = content?.table;
  const form = content?.form;
  const { setProcess } = useProcess();
  const { confirm, dialog } = useConfirmDialog();

  const {
    config,
    list,
    loading,
    reload,
    isSkeleton,
    onDelete,
    onPost,
    onUpdate,
    can,
  } = useEntity(entity, {
    searchParameter: extra?.searchParameter || {},
    // OPTIONS `content.rbac` drives method permissions for this screen —
    // {"viewer": ["GET"], "admin": ["*"]} or a flat list for all roles.
    rbac: content?.rbac,
  });

  const [openForm, setOpenForm] = useState(false);
  const [populateData, setPopulateData] = useState<any>(null);
  const [searchValue, setSearchValue] = useState(config?.search || "");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setSearchValue(config?.search || "");
  }, [config?.search]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchValue !== (config?.search || "")) {
        setSearchLoading(true);
        await reload({ search: searchValue });
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchValue, reload, config?.search]);

  const formOpenManage = (prop: boolean, data: any = null) => {
    setPopulateData(data);
    setOpenForm(prop);
  };

  const onChangeHandle = async ({
    type,
    value,
  }: {
    type: string;
    value: any;
  }) => {
    switch (type) {
      case "page":
        setProcess(true);
        await reload({ page: value });
        break;
      case "itemPerPage":
        setProcess(true);
        await reload({ itemPerPage: value });
        break;
      case "sortBy":
        setProcess(true);
        await reload({ sortBy: value });
        break;
      case "orderBy":
        setProcess(true);
        await reload({ orderBy: value });
        break;
      case "searchParameter":
        setProcess(true);
        await reload({ searchParameter: value });
        break;
      case "filter":
        setProcess(true);
        await reload({ ...value });
        break;
      case "sort":
        setProcess(true);
        await reload({ sortBy: value.key, orderBy: value.direction });
        break;
      case "search":
        setSearchValue(value);
        break;
      default:
        break;
    }
    setProcess(false);
  };

  return {
    entity,
    table,
    form,
    config,
    list: Array.isArray(list) ? list : (list ? [list] : []),
    loading,
    isSkeleton,
    searchLoading,
    searchValue,
    openForm,
    populateData,
    onDelete,
    onPost,
    onUpdate,
    can,

    formOpenManage,
    onChangeHandle,
    confirm,
    dialog,
    setProcess,
  };
};
