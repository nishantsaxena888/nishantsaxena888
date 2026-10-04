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
import type React from "react";
import type { RenderComponentProps } from "@/engine/render-engine/features/types";

import Grid from "./grid";
import Col from "./col";
import Container from "./container";
import Section from "./section";
import Stack from "./stack";
import Spacer from "./spacer";

export const layout_components: Record<string, React.ComponentType<RenderComponentProps>> = {
  grid: Grid,
  col: Col,
  container: Container,
  section: Section,
  stack: Stack,
  spacer: Spacer,
};
