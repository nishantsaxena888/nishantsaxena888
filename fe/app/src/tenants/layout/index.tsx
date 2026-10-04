/**
 * Generic structural layout primitives — pure containers that arrange
 * their def.children. No client logic lives here; every knob is read
 * from def.properties / def.content so a client builds any page layout
 * from JSON alone.
 *
 * Contract (page-def JSON):
 *
 *   {"type":"grid","properties":{"columns":12,"gap":"24px"},"children":[
 *     {"type":"col","properties":{"span":8,"span_md":12},
 *      "children":[<any def>]},
 *     {"type":"col","properties":{"span":4},"children":[<any def>]}
 *   ]}
 *
 *   {"type":"section","properties":{"background":"#f8f8f0","padding":"48px 0"},
 *    "children":[ ... ]}                      — full-bleed band
 *   {"type":"container","properties":{"max_width":"1200px"},"children":[...]}
 *   {"type":"stack","properties":{"gap":"16px"},"children":[...]}
 *   {"type":"spacer","properties":{"height":"40px"}}
 */

import "./layout.css";
import React from "react";
import type { RenderComponentProps } from "@/engine/render-engine/features/types";

interface LayoutProps extends RenderComponentProps {
  children?: React.ReactNode;
}

const p = (props: LayoutProps) => ({ ...(props.content || {}), ...(props.properties || {}) });

/** 12-col (configurable) CSS grid — children declare their own span via `col`. */
const Grid: React.FC<LayoutProps> = (props) => {
  const o = p(props);
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

/** Grid cell — self-declares span so the parent never needs child props. */
const Col: React.FC<LayoutProps> = (props) => {
  const o = p(props);
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

/** Centered max-width wrapper. */
const Container: React.FC<LayoutProps> = (props) => {
  const o = p(props);
  return (
    <div
      className={`lx-container ${o.class_name || ""}`}
      style={{ maxWidth: o.max_width, padding: o.padding, margin: o.margin, ...(o.style || {}) }}
    >
      {props.children}
    </div>
  );
};

/** Full-bleed band (background/colour/padding) wrapping children. */
const Section: React.FC<LayoutProps> = (props) => {
  const o = p(props);
  return (
    <section
      className={`lx-section ${o.class_name || ""}`}
      style={{ background: o.background, padding: o.padding, margin: o.margin, ...(o.style || {}) }}
    >
      {props.children}
    </section>
  );
};

/** Vertical flex stack with configurable gap. */
const Stack: React.FC<LayoutProps> = (props) => {
  const o = p(props);
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

/** Empty vertical space. */
const Spacer: React.FC<LayoutProps> = (props) => {
  const o = p(props);
  return <div className={`lx-spacer ${o.class_name || ""}`} style={{ height: o.height || "24px", ...(o.style || {}) }} aria-hidden />;
};

export const layout_components: Record<string, React.ComponentType<RenderComponentProps>> = {
  grid: Grid,
  col: Col,
  container: Container,
  section: Section,
  stack: Stack,
  spacer: Spacer,
};
