import React from "react";
import { type Definition } from "./features/types";
import { useRenderEngine } from "./features/render-engine-context";
import { RenderDefinition } from "./features/render-definition";
import { useFormStyleStore } from "@/store/use-form-style";

interface RenderEngineProps {
  data: Definition[];
  config?: any;
}

export function RenderEngine({ data, config }: RenderEngineProps) {
  const { componentMap } = useRenderEngine();
  const { themeName } = useFormStyleStore();

  if (!componentMap || Object.keys(componentMap).length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          border: "2px solid #ef4444",
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          borderRadius: "8px",
        }}
      >
        <strong>Configuration Error:</strong> The Component Map is empty or
        undefined. Please provide components to the RenderEngineProvider.
      </div>
    );
  }

  const elements: React.ReactNode[] = [];

  if (!data || !Array.isArray(data)) {
    return null;
  }

  data.forEach((def) => {
    const rendered = (
      <RenderDefinition key={def.id} def={def} config={config} />
    );

    if (def.properties.level === "base") {
      elements.push(rendered);
    } else {
      elements.push(
        <div key={`nested-${def.id}`} style={{ paddingLeft: "20px" }}>
          {rendered}
        </div>,
      );
    }
  });

  return <div className="render-engine">{elements}</div>;
}
