import { IteratorModule } from "@/components/shared/iterator";
import { DefaultEditModule } from "./utils/default-editmodule";
import { DefaultPagination } from "./utils/default-pagination";
import { ItemsPerPageInfo } from "./utils/item-per-page-info";
import { AdminSkeleton } from "./utils/admin-skeleton";
import { toast } from "sonner";
import { useFormStyleStore } from "@/store/use-form-style";
import { useCurdEntity } from "./utils/use-curd-entity";

export const DefaultAdmin = (prop: any) => {
  const {
    table,
    list,
    form,
    openForm,
    formOpenManage,
    config,
    onChangeHandle,
    populateData,
    isSkeleton,
    searchLoading,
    searchValue,
    onDelete,
    onPost,
    onUpdate,
    confirm,
    dialog,
    setProcess,
  } = useCurdEntity(prop);

  const { styles, themeName } = useFormStyleStore();
  return (
    <div className="p-6">
      {isSkeleton ? (
        <AdminSkeleton />
      ) : (
        <>
          {openForm ? (
            <DefaultEditModule
              formOpenManage={formOpenManage}
              form={form}
              config={config}
              populateData={populateData}
              onPost={onPost}
              onUpdate={onUpdate}
              setProcess={setProcess}
            />
          ) : (
            <div className="space-y-4">
              <IteratorModule
                data={list || []}
                config={table || {}}
                id={prop.config?.activePage?.entity}
                onAddRecord={() => formOpenManage(true)}
                createButtonlabel={
                  prop.config?.activePage?.name
                    ? `Add ${prop.config.activePage.name}`
                    : "Add Record"
                }
                search={searchValue}
                loading={searchLoading}
                onSearchChange={(prop) =>
                  onChangeHandle({ type: "search", value: prop })
                }
                hideViewSwitcher={true}
                contentClassName={"min-h-[calc(100vh-232px)]"}
                styles={styles}
                themeName={themeName}
                action={{
                  // onRowClick: (row: any) => {
                  //   formOpenManage(true, row);
                  // },
                  onEdit: (row: any) => {
                    formOpenManage(true, row);
                  },
                  onDelete: async (row: any) => {
                    const confirmRes = await confirm({
                      title: "Delete",
                      description:
                        "Are you sure you want to delete this record?",
                    });

                    if (confirmRes) {
                      setProcess(true);
                      const response = await onDelete(row.id || row);
                      if (response) {
                        toast.success("Record deleted successfully");
                      }
                      setProcess(false);
                    }
                  },
                  onSort: (key, direction) => {
                    onChangeHandle({ type: "sort", value: { key, direction } });
                  },
                  onFilter: (filters) => {
                    onChangeHandle({ type: "filter", value: filters });
                  },
                }}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-2 gap-4">
                <ItemsPerPageInfo
                  itemPerPage={config?.itemPerPage || 10}
                  total={config?.total || 0}
                  listLength={list?.length || 0}
                  onItemPerPageChange={(val) =>
                    onChangeHandle({
                      type: "itemPerPage",
                      value: val,
                    })
                  }
                />
                <DefaultPagination
                  currentPage={config?.currentPage || 1}
                  totalPages={config?.pages || 1}
                  onPageChange={(page) =>
                    onChangeHandle({
                      type: "page",
                      value: page,
                    })
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
      {dialog}
    </div>
  );
};
