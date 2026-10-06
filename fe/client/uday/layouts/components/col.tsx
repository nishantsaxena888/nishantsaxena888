import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** Grid cell — self-declares span so the parent never needs child props. */
const Col: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return (
    <div
      className={`lx-col ${o.class_name || ""}`}
      style={{
        "--col-span": o.span || 12,
        "--col-span-md": o.span_md,
        "--col-span-sm": o.span_sm,
        order: o.order,
        alignSelf: o.align,
        padding: o.padding,
        ...(o.style || {}),
      } as React.CSSProperties}
    >
      {props.children}
    </div>
  );
};

export default Col;
