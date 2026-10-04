import { Fragment } from "react/jsx-runtime";
import { defaultFormat } from "./utils";
import { getValueByPath } from "@/lib/get-value-by-path";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const DataRenderer = ({
  value,
  emptyText,
  columnResolver,
  name,
}: {
  value: any;
  row: any;
  rowIndex: number;
  emptyText: string;
  columnResolver?: any;
  name: string;
}) => {
  const displayValue = columnResolverHandle(
    columnResolver,
    value,
    emptyText,
    name,
  );
  return <>{displayValue}</>;
};

const columnResolverHandle = (
  config: any,
  value: any,
  emptyText: string,
  name: string,
) => {
  if (!config) {
    return defaultFormat(value, emptyText);
  }
  if (typeof config === "string") {
    return value[config];
  }
  if (Array.isArray(config)) {
    return config.map((item) => value[item]).join(", ");
  }
  if (typeof config === "object") {
    const list = Object.entries(config);
    return list.map(([lKey, rKey]: any) => {
      return (
        <Fragment key={lKey}>
          {lKey}:{getValueByPath({ [name]: value }, rKey)} {", "}
        </Fragment>
      );
    });
  }
  return defaultFormat(value, emptyText);
};

