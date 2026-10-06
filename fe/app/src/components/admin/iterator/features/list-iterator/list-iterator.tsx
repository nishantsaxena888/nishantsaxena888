import { defaultFormat } from '../utils'

export const ListIterator = ({
  visibleColumns,
  data,
  emptyText,
  action,
  selectedRows,
  onSelectedRowChange,
  configuration
}: any) => {
  const CustomListComponent = configuration?.listComponent;

  return (
    <div className="list-iterator-wrapper">
      {data.map((row: any, rowIndex: number) => {
        const isSelected = selectedRows?.some((r: any) => r.id === row.id || r === row);

        if (CustomListComponent) {
           return <CustomListComponent key={rowIndex} row={row} rowIndex={rowIndex} isSelected={isSelected} selectedRows={selectedRows} onSelectedRowChange={onSelectedRowChange} action={action} visibleColumns={visibleColumns} emptyText={emptyText} />
        }
        return (
          <div 
            key={rowIndex} 
            onClick={() => action?.onRowClick?.(row)}
            className={`list-item ${isSelected ? 'selected' : ''}`}
            style={{ cursor: action?.onRowClick ? "pointer" : "default" }}
          >
            <input 
              type="checkbox" 
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.checked) {
                  onSelectedRowChange?.([...(selectedRows || []), row]);
                } else {
                  onSelectedRowChange?.((selectedRows || []).filter((r: any) => r !== row && r.id !== row.id));
                }
              }}
            />
            <div style={{ display: "flex", flex: 1, flexWrap: "wrap", gap: "16px" }}>
              {visibleColumns.map((column: any, index: number) => {
                const value = row[column.key];
                const content = column.render ? column.render(value, row, rowIndex, emptyText) : defaultFormat(value, emptyText);
                return (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "150px" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>{column.label}:</span>
                    <span style={{ fontSize: "14px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{content}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}