import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  onClick?: () => void;
}

export const BuilderButton: React.FC<Props & { componentId?: string }> = ({
  properties,
  onClick,
  componentId,
}) => {
  const style = buildStyle(properties, "button");
  const className = componentId ? `elem-${componentId}` : undefined;
  return (
    <button
      id={className}
      className={className}
      style={style}
      onClick={onClick}
    >
      {properties.buttonText || "Button"}
    </button>
  );
};
