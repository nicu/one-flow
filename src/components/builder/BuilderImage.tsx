import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTranslation } from "react-i18next";
import SmartImage from "../SmartImage";

interface Props {
  properties: ComponentProperties;
}

export const BuilderImage: React.FC<Props & { componentId?: string }> = ({
  properties,
  componentId,
}) => {
  const { t } = useTranslation();
  const style = buildStyle(properties, "image");
  const className = componentId ? `elem-${componentId}` : undefined;
  const altKey = componentId ? `${componentId}.alt` : undefined;
  const isBound = Boolean(
    properties &&
      properties.dataBinding &&
      (properties.dataBinding.fieldId || properties.dataBinding.collectionId)
  );
  const alt = isBound
    ? properties.alt
    : altKey
    ? t(altKey, properties.alt || "")
    : properties.alt;
  return (
    <SmartImage
      id={className}
      className={className}
      src={properties.src || ""}
      alt={alt || ""}
      style={style}
      query={properties?.alt || undefined}
      widthHint={
        typeof style?.width === "number" ? (style.width as number) : undefined
      }
    />
  );
};
