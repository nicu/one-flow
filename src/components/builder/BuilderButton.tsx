import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTranslation } from "react-i18next";

interface Props {
  properties: ComponentProperties;
  onClick?: () => void;
}

export const BuilderButton: React.FC<Props & { componentId?: string }> = ({
  properties,
  onClick,
  componentId,
}) => {
  const { t } = useTranslation();
  const style = buildStyle(properties, "button");
  const className = componentId ? `elem-${componentId}` : undefined;
  const key = componentId ? `${componentId}.buttonText` : undefined;
  const label = key
    ? t(key, properties.buttonText || "")
    : properties.buttonText;
  return (
    <button
      id={className}
      className={className}
      style={style}
      onClick={onClick}
    >
      {label || "Button"}
    </button>
  );
};
