import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** Vertical flex stack with configurable gap. */
const Stack: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return (
    <div
      className={`lx-stack ${o.class_name || ""}`}
      style={{
        gap: o.gap,
        alignItems: o.align,
        justifyContent: o.justify,
        padding: o.padding,
        margin: o.margin,
        flexDirection: o.direction,
        flexWrap: o.wrap,
        ...(o.style || {}),
      }}
    >
      {props.children}
    </div>
  );
};

export default Stack;
