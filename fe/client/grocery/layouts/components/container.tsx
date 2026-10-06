import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** Centered max-width wrapper. */
const Container: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return (
    <div
      className={`lx-container ${o.class_name || ""}`}
      style={{ maxWidth: o.max_width, padding: o.padding, margin: o.margin, ...(o.style || {}) }}
    >
      {props.children}
    </div>
  );
};

export default Container;
