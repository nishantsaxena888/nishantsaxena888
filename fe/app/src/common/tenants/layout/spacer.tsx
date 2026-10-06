import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** Empty vertical space. */
const Spacer: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return <div className={`lx-spacer ${o.class_name || ""}`} style={{ height: o.height || "24px", ...(o.style || {}) }} aria-hidden />;
};

export default Spacer;
