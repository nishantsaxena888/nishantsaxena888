export type IteratorType = "table" | "list" | "grid";

export type IteratorConfig = {
  onAddRecord?: () => void;
  createButtonlabel?: string;
  data: any[];
  emptyText?: string;
  config: any;
  type?: IteratorType;
  id?: string;
  configuration?: {
    columnKey?: string;
    sortDirection?: "asc" | "desc";
    selectedRow?: any;
    selectedRows?: any[];
    tableClassName?: string;
    rowClassName?: string | ((row: any, index: number) => string);
    cellClassName?:
      | string
      | ((value: any, row: any, column: IteratorColumn) => string);
    gridComponent?: React.FC<any> | React.ComponentType<any>;
    listComponent?: React.FC<any> | React.ComponentType<any>;
  };
  action?: {
    onSort?: (columnKey: string, sortDirection: string) => void;
    onRowClick?: (rowData: any) => void;
    onSelectedRowChange?: (selectedRows: any | any[]) => void;
    onEdit?: (rowData: any) => void;
    onDelete?: (rowData: any) => void;
    onFilter?: (filters: any) => void;
  };
  search?: string;
  onSearchChange?: (val: string) => void;
  loading?: boolean;
  hideViewSwitcher?: boolean;
  contentClassName?: string;
  styles?: {
    fieldHeight?: string;
    fieldBorderRadius?: string;
    primaryColor?: string;
    fontSize?: string;
  };
  themeName?: string;
};

export type IteratorColumn = {
  key: string;
  label: string;
  hide?: boolean;
  render?: (
    value: any,
    row: any,
    rowIndex: number,
    emptyText: string,
  ) => React.ReactNode;
  columnResolver?: any;
  name: string;
};
