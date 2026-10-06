"use client";

import { Tag, Truck, MapPin, Layers } from "lucide-react";
import { useFormConfig } from "@/components/admin/form-render/utils/form-config-context";
import { useManytoMany } from "./utils/use-many-to-many";
import { useFormStyleStore } from "@/common/store/use-form-style";
import { DefaultPagination } from "@/tenants/admin/default-admin/utils/default-pagination";
import { ItemsPerPageInfo } from "@/tenants/admin/default-admin/utils/item-per-page-info";
import { IteratorModule } from "@/components/admin/iterator";
import { AdminSkeleton } from "@/tenants/admin/default-admin/utils/admin-skeleton";
import { toast } from "@/common/lib/toast";
import { ManyToManyForm } from "./utils/many-to-many-form";
import { createPortal } from "react-dom";

export const ManyToMany = (props: any) => {


  const entity = props?.config?.entity || props?.config?.endpoint;

  const getIcon = () => {
    const labelLower = (props.label || props.config?.title || "").toLowerCase();
    if (labelLower.includes("price") || labelLower.includes("tier")) {
      return <Tag className="h-6 w-6 stroke-[1.75]" />;
    }
    if (labelLower.includes("supplier")) {
      return <Truck className="h-6 w-6 stroke-[1.75]" />;
    }
    if (labelLower.includes("location") || labelLower.includes("warehouse")) {
      return <MapPin className="h-6 w-6 stroke-[1.75]" />;
    }
    return <Layers className="h-6 w-6 stroke-[1.75]" />;
  };

  const { populateData } = useFormConfig();
  const id = populateData?.id;

  // Resolve dynamic values from populateData (supporting nested paths like "user.id" or special "$id")
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const resolveValue = (val: any) => {
    if (typeof val !== "string") return val;
    if (val === "$id") return id;
    const resolved = getNestedValue(populateData, val);
    return resolved !== undefined ? resolved : val;
  };

  // Resolve searchParameter from config if provided, replacing the value with resolved dynamic key
  const searchParameter = props?.config?.searchParameter;
  const defaultFilter = searchParameter
    ? Object.keys(searchParameter).reduce((acc: any, key: string) => {
      acc[key] = resolveValue(searchParameter[key]);
      return acc;
    }, {})
    : { [props?.config?.bindValue]: id };



  const {
    table,
    list,
    form,
    openForm,
    formOpenManage,
    config,
    onChangeHandle,
    populateMMData,
    isSkeleton,
    searchLoading,
    searchValue,
    onDelete,
    onPost,
    onUpdate,
    confirm,
    dialog,
    setProcess,
  } = useManytoMany({
    entity: entity,
    defaultFilter: defaultFilter,
  });


  const { styles, themeName } = useFormStyleStore();

  const mergedTable = {
    ...table,
    columns: props?.config?.columns || table?.columns,
  };

  return (
    <div className="space-y-4 w-full">

      <div className="">
        {isSkeleton ? (
          <AdminSkeleton />
        ) : (
          <>
            {id ? (
              <div className="space-y-4">
                <IteratorModule
                  data={list || []}
                  config={mergedTable}
                  id={entity}
                  onAddRecord={() => formOpenManage(true)}
                  createButtonlabel={props.config?.name || `Link ${props?.label || "Record"}`}
                  search={searchValue}
                  loading={searchLoading}
                  onSearchChange={(prop: any) =>
                    onChangeHandle({ type: "search", value: prop })
                  }
                  hideViewSwitcher={true}
                  contentClassName={"max-h-[calc(100vh-232px)]"}
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
                    onSort: (key: any, direction: any) => {
                      onChangeHandle({
                        type: "sort",
                        value: { key, direction },
                      });
                    },
                    onFilter: (filters: any) => {
                      onChangeHandle({ type: "filter", value: filters });
                    },
                  }}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-2 gap-4">
                  <ItemsPerPageInfo
                    itemPerPage={config?.itemPerPage || 10}
                    total={config?.total || 0}
                    listLength={list?.length || 0}
                    onItemPerPageChange={(val: any) =>
                      onChangeHandle({
                        type: "itemPerPage",
                        value: val,
                      })
                    }
                  />
                  <DefaultPagination
                    currentPage={config?.currentPage || 1}
                    totalPages={config?.pages || 1}
                    onPageChange={(page: any) =>
                      onChangeHandle({
                        type: "page",
                        value: page,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-xs transition-all duration-300 hover:border-primary/30 hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40 group my-2">
                <div className="p-3.5 rounded-full bg-primary/10 text-primary mb-3.5 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                  {getIcon()}
                </div>
                <h4 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {props.label || props.config?.title || "Relations"} Setup
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-4 leading-relaxed">
                  To manage and associate {props.label || props.config?.title || "records"}, please save this record first.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider border border-zinc-200/50 dark:border-zinc-700/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {props?.config?.emptyMessage || "Selection Required"}
                </div>
              </div>
            )}
          </>
        )}
        {dialog}
      </div>
      {createPortal(
        <ManyToManyForm
          openForm={openForm}
          formOpenManage={formOpenManage}
          form={form}
          config={config}
          populateData={{ ...defaultFilter, ...populateMMData }}
          isEdit={!!populateMMData}
          label={props.label || props.config?.title || form?.title || "Record"}
          onPost={onPost}
          onUpdate={onUpdate}
          setProcess={setProcess}
          styles={styles}
          themeName={themeName}
        />,
        document.body,
      )}
    </div>
  );
};
