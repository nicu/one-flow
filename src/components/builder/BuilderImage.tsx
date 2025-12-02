import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderImage: React.FC<Props & { componentId?: string }> = ({
  properties,
  componentId,
}) => {
  const style = buildStyle(properties, "image");
  const className = componentId ? `elem-${componentId}` : undefined;
  return (
    <img
      id={className}
      className={className}
      src={properties.src || ""}
      alt={properties.alt || ""}
      style={style}
    />
  );
};
