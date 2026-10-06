import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** 12-col (configurable) CSS grid — children declare their own span via `col`. */
const Grid: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return (
    <div
      className={`lx-grid ${o.class_name || ""}`}
      style={{
        gridTemplateColumns: `repeat(${o.columns || 12}, 1fr)`,
        gap: o.gap,
        rowGap: o.row_gap,
        columnGap: o.column_gap,
        alignItems: o.align,
        justifyItems: o.justify,
        padding: o.padding,
        margin: o.margin,
        ...(o.style || {}),
      }}
    >
      {props.children}
    </div>
  );
};

export default Grid;
