import { defaultFormat } from '../utils'

export const GridIterator = ({
  visibleColumns,
  data,
  emptyText,
  action,
  selectedRows,
  onSelectedRowChange,
  configuration
}: any) => {
  const CustomGridComponent = configuration?.gridComponent;

  return (
    <div className="grid-iterator-wrapper">
      {data.map((row: any, rowIndex: number) => {
        const isSelected = selectedRows?.some((r: any) => r.id === row.id || r === row);

        if (CustomGridComponent) {
           return <CustomGridComponent key={rowIndex} row={row} rowIndex={rowIndex} isSelected={isSelected} selectedRows={selectedRows} onSelectedRowChange={onSelectedRowChange} action={action} visibleColumns={visibleColumns} emptyText={emptyText} />
        }
        return (
          <div 
            key={rowIndex} 
            onClick={() => action?.onRowClick?.(row)}
            className={`grid-card ${isSelected ? 'selected' : ''}`}
            style={{ cursor: action?.onRowClick ? "pointer" : "default" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
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
              <span style={{ fontSize: "14px", color: "#888" }}>#{rowIndex + 1}</span>
            </div>
            {visibleColumns.map((column: any, index: number) => {
              const value = row[column.key];
              const content = column.render ? column.render(value, row, rowIndex, emptyText) : defaultFormat(value, emptyText);
              return (
                <div key={index} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>{column.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content}</span>
                </div>
              );
            })}
          </div>
        )
      })}
    </div>
  )
}