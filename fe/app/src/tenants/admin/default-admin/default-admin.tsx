import { IteratorModule } from "@/components/admin/iterator";
import { DefaultEditModule } from "./utils/default-editmodule";
import { DefaultPagination } from "./utils/default-pagination";
import { ItemsPerPageInfo } from "./utils/item-per-page-info";
import { AdminSkeleton } from "./utils/admin-skeleton";
import { toast } from "@/lib/toast";
import { useFormStyleStore } from "@/store/use-form-style";
import { useCurdEntity } from "./utils/use-curd-entity";
import { useState, useEffect } from "react";
import { useNav } from "@/platform/navigation";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon-picker";
import {
  exportCsv,
  runDeclarativeAction,
} from "./utils/declarative-actions";
import { useConfigStore } from "@/store/use-config-store";
import { currentRole, roleAllowed, visibleByRole } from "@/engine/library/rbac";

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
    can,
    confirm,
    dialog,
    setProcess,
  } = useCurdEntity(prop);

  const { styles, themeName } = useFormStyleStore();
  const { navigate } = useNav();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Declarative table actions — OPTIONS content.table.row_actions /
  // bulk_actions / export drive this generic executor. Each action may
  // carry `roles` — filtered here the same way the backend filters them.
  const role = currentRole(useConfigStore((s: any) => s.config));
  const rowActions = (table?.row_actions || []).filter((a: any) =>
    roleAllowed(a.roles, role),
  );
  const bulkActions = (table?.bulk_actions || []).filter((a: any) =>
    roleAllowed(a.roles, role),
  );
  // Client-side mirror of the server's field ACL — columns[].roles and
  // fields[].roles let ONE static mock OPTIONS serve every role.
  const tableView = table
    ? { ...table, columns: visibleByRole(table.columns, role) }
    : table;
  const formView = form
    ? { ...form, fields: visibleByRole(form.fields, role) }
    : form;
  const exportable = table?.export === true;
  const entity = prop.config?.activePage?.entity;

  const reload = () =>
    onChangeHandle({ type: "page", value: config?.currentPage || 1 });

  // Declarative polling — OPTIONS table.refresh_interval (seconds) keeps
  // the list live without a custom component (orders, dashboards).
  const refreshSec = table?.refresh_interval;
  useEffect(() => {
    if (typeof refreshSec !== "number" || refreshSec <= 0) return;
    const id = setInterval(reload, refreshSec * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSec]);

  const runAction = async (def: any, rows: any[]) => {
    if (def.confirm) {
      const ok = await confirm(
        typeof def.confirm === "string"
          ? { title: def.label || def.name, description: def.confirm }
          : def.confirm,
      );
      if (!ok) return;
    }
    setProcess(true);
    if (def.name === "export_csv") {
      exportCsv(
        def.filename || `${entity || "export"}.csv`,
        rows,
        table?.columns || [],
      );
    } else if (def.name === "bulk_delete") {
      for (const row of rows) {
        const res = await onDelete(row.id || row);
        if (!res) break;
      }
    } else {
      let failed = 0;
      for (const row of rows) {
        const { ok } = await runDeclarativeAction(def, row, {
          entity,
          navigate,
        });
        if (!ok) failed++;
      }
      if (failed) {
        toast.error(`${def.label || def.name} failed on ${failed} item(s)`);
      } else {
        toast.success(`${def.label || def.name} done`);
      }
    }
    setProcess(false);
    await reload();
  };
  return (
    <div className="p-6">
      {isSkeleton ? (
        <AdminSkeleton />
      ) : (
        <>
          {openForm ? (
            <DefaultEditModule
              formOpenManage={formOpenManage}
              form={formView}
              config={config}
              populateData={populateData}
              onPost={onPost}
              onUpdate={onUpdate}
              setProcess={setProcess}
            />
          ) : (
            <div className="space-y-4">
              {(bulkActions.length > 0 || exportable) && (
                <div className="flex items-center gap-2 px-1">
                  {selectedRows.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedRows.length} selected
                    </span>
                  )}
                  {bulkActions.map((def: any) => (
                    <Button
                      key={def.name}
                      variant="outline"
                      size="sm"
                      disabled={selectedRows.length === 0}
                      onClick={() => runAction(def, selectedRows)}
                    >
                      {def.icon && (
                        <Icon name={def.icon as IconName} className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {def.label || def.name}
                    </Button>
                  ))}
                  {exportable && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!list?.length}
                      onClick={() =>
                        exportCsv(
                          `${entity || "export"}.csv`,
                          selectedRows.length ? selectedRows : list || [],
                          table?.columns || [],
                        )
                      }
                    >
                      Export CSV{selectedRows.length ? ` (${selectedRows.length})` : ""}
                    </Button>
                  )}
                </div>
              )}
              <IteratorModule
                data={list || []}
                config={tableView || {}}
                id={prop.config?.activePage?.entity}
                onAddRecord={
                  can?.("post") ? () => formOpenManage(true) : undefined
                }
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
                  customActions: rowActions,
                  onCustomAction: (row: any, def: any) => runAction(def, [row]),
                  onSelectedRowChange: (rows: any[]) => setSelectedRows(rows || []),
                  onEdit: can?.("put")
                    ? (row: any) => {
                        formOpenManage(true, row);
                      }
                    : undefined,
                  onDelete: can?.("delete")
                    ? async (row: any) => {
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
                      }
                    : undefined,
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
