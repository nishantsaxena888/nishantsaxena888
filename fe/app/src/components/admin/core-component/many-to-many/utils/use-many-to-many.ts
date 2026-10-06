import { useEntity } from "@/common/engine";
import { useConfirmDialog } from "@/common/hooks/use-confirm-dialog";
import { useProcess } from "@/common/store/use-process";
import { useState, useEffect } from "react";

export const useManytoMany = ({ entity, defaultFilter }: any) => {
  const { setProcess } = useProcess();
  const { confirm, dialog } = useConfirmDialog();

  const {
    option,
    config,
    list,
    loading,
    reload,
    isSkeleton,
    onDelete,
    onPost,
    onUpdate,
  } = useEntity(entity, {
    searchParameter: { ...defaultFilter },
  });


  const [openForm, setOpenForm] = useState(false);
  const [populateMMData, setPopulateMMData] = useState<any>(null);
  const [searchValue, setSearchValue] = useState(config?.search || "");
  const [searchLoading, setSearchLoading] = useState(false);

  const [prevConfigSearch, setPrevConfigSearch] = useState(config?.search);
  if (config?.search !== prevConfigSearch) {
    setPrevConfigSearch(config?.search);
    setSearchValue(config?.search || "");
  }

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
    setPopulateMMData(data);
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
    table: option?.content?.table,
    form: option?.content?.form,
    config,
    list,
    loading,
    isSkeleton,
    searchLoading,
    searchValue,
    openForm,
    populateMMData,
    onDelete,
    onPost,
    onUpdate,
    option,

    formOpenManage,
    onChangeHandle,
    confirm,
    dialog,
    setProcess,
  };
};
