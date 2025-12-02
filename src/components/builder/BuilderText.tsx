import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderText: React.FC<Props & { componentId?: string }> = ({
  properties,
  componentId,
}) => {
  const style = buildStyle(properties, "text");
  const className = componentId ? `elem-${componentId}` : undefined;
  return (
    <div id={className} className={className} style={style}>
      {properties.text || "Text"}
    </div>
  );
};
