import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTranslation } from "react-i18next";

interface Props {
  properties: ComponentProperties;
}

export const BuilderText: React.FC<Props & { componentId?: string }> = ({
  properties,
  componentId,
}) => {
  const { t } = useTranslation();
  const style = buildStyle(properties, "text");
  const className = componentId ? `elem-${componentId}` : undefined;
  const key = componentId ? `${componentId}.text` : undefined;
  const isBound = Boolean(
    properties &&
      properties.dataBinding &&
      (properties.dataBinding.fieldId || properties.dataBinding.collectionId)
  );
  const content = isBound
    ? properties.text
    : key
    ? t(key, properties.text || "")
    : properties.text;
  return (
    <div id={className} className={className} style={style}>
      {content || "Text"}
    </div>
  );
};
