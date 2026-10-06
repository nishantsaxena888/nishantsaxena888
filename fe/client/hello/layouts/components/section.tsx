import React from "react";
import { layoutOptions, type LayoutProps } from "./layout-props";

/** Full-bleed band (background/colour/padding) wrapping children. */
const Section: React.FC<LayoutProps> = (props) => {
  const o = layoutOptions(props);
  return (
    <section
      className={`lx-section ${o.class_name || ""}`}
      style={{ background: o.background, padding: o.padding, margin: o.margin, ...(o.style || {}) }}
    >
      {props.children}
    </section>
  );
};

export default Section;
