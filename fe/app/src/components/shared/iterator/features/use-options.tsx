/* eslint-disable @typescript-eslint/no-explicit-any */
import { inputType } from "../input-type";
import { DataRenderer } from "./data-renderer";

export const useIteratorOptions = ({ config }: any) => {
  if (!config) return [];

  // Support both old 'config.table' + 'config.schema' pattern AND new 'config.columns' pattern
  const columnsArr = Array.isArray(config.columns)
    ? config.columns
    : Array.isArray(config)
    ? config
    : Array.isArray(config.table)
    ? config.table
    : [];

  const baseSchema = Array.isArray(config.schema)
    ? config.schema.reduce(
        (acc: any, item: any) => ({ ...acc, [item.name]: item }),
        {},
      )
    : {};

  const columns = columnsArr.map((item: any) => {
    const currentSchema = baseSchema[item.key] || { ui: {} };
    
    return {
      name: item.name || item.key,
      ...item,
      inputType: currentSchema.kind ? inputType(currentSchema) : (item.type || "text"),
      hide: item.hide || currentSchema.ui?.hidden || false,
      render: (value: any, row: any, rowIndex: number, emptyText: string) => (
        <DataRenderer
          value={value}
          row={row}
          rowIndex={rowIndex}
          emptyText={emptyText}
          columnResolver={item.columnResolver}
          name={item.key}
        />
      ),
    };
  });
  return columns;
};
