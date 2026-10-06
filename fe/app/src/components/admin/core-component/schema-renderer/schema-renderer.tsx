// Import existing shared components
import { DataTable } from "@/components/admin/core-component/data-table/data-table";

export interface SchemaRendererProps {
  schema: any;
  data?: any[];
}

export function SchemaRenderer({ schema, data = [] }: SchemaRendererProps) {
  if (!schema || !schema.config || !Array.isArray(schema.config)) {
    return <div className="p-4 text-red-500">Invalid Schema Definition</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {schema.config.map((module: any, index: number) => {
        const tableConfig = module.content?.table;
        const formConfig = module.content?.form;

        return (
          <div key={module.id || index} className="w-full flex flex-col gap-8">
            {/* 1. Render Table if defined in schema */}
            {tableConfig && (
              // Note: DataTable will need to be refactored to accept this `tableConfig` prop
              // so it can dynamically generate its columns instead of being hardcoded.
              <div className="border border-border rounded-xl bg-card p-2 sm:p-4">
                <h3 className="text-lg font-bold mb-4 px-2">{schema.meta?.title || "Table"}</h3>
                <DataTable data={data} config={tableConfig} />
              </div>
            )}

            {/* 2. Render Form if defined in schema */}
            {formConfig && (formConfig.inputs?.length > 0 || formConfig.schema?.length > 0) && (
              <div className="border border-border rounded-xl bg-card p-6">
                {formConfig.title && <h3 className="text-xl font-bold mb-2">{formConfig.title}</h3>}
                {formConfig.description && <p className="text-sm text-muted-foreground mb-6">{formConfig.description}</p>}

                <div className="grid grid-cols-12 gap-4">
                  {(formConfig.inputs || formConfig.schema)?.map((input: any) => (
                    <div key={input.name} className={`col-span-12 md:col-span-${input.column?.md || 12}`}>
                      {/* Map input types to existing shared components */}
                      <div className="text-sm font-semibold mb-2">{input.label}</div>
                      <div className="h-10 border border-input rounded-md flex items-center px-3 text-muted-foreground text-sm">
                        [ {input.type || input.kind} input - {input.placeholder || input.name} ]
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button className="px-4 py-2 text-sm font-medium border border-input rounded-md">{formConfig.labels?.cancel || "Cancel"}</button>
                  <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow">{formConfig.labels?.submit || "Submit"}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
