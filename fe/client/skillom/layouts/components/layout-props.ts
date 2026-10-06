import type React from "react";
import type { RenderComponentProps } from "@/tenants/types";

export interface LayoutProps extends RenderComponentProps {
  children?: React.ReactNode;
}

/** Merge def.content + def.properties into a flat options bag. */
export const layoutOptions = (props: LayoutProps) => ({
  ...(props.content || {}),
  ...(props.properties || {}),
});
