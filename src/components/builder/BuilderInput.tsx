import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTranslation } from "react-i18next";

interface Props {
  properties: ComponentProperties;
  value?: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  showLabel?: boolean;
  componentId?: string;
}

export const BuilderInput: React.FC<Props> = ({
  properties,
  value,
  onChange,
  editable,
  showLabel = true,
  componentId,
}) => {
  const { t } = useTranslation();
  const style = buildStyle(properties, "input");
  const inputType = properties.inputType || "text";
  const className = componentId ? `elem-${componentId}` : undefined;
  const placeholderKey = componentId ? `${componentId}.placeholder` : undefined;
  const labelKey = componentId ? `${componentId}.label` : undefined;
  const isBound = Boolean(
    properties &&
      properties.dataBinding &&
      (properties.dataBinding.fieldId || properties.dataBinding.collectionId)
  );
  const placeholder = isBound
    ? properties.placeholder
    : placeholderKey
    ? t(placeholderKey, properties.placeholder || "")
    : properties.placeholder;
  const labelText = isBound
    ? properties.label
    : labelKey
    ? t(labelKey, properties.label || "")
    : properties.label;

  const inputElement = (props: any) => (
    <input
      id={className}
      className={className}
      type={inputType}
      placeholder={placeholder || ""}
      style={style}
      {...props}
    />
  );

  if (onChange || editable) {
    return (
      <div>
        {showLabel && labelText ? (
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
            {labelText}
          </label>
        ) : null}
        {inputElement({
          value: value ?? "",
          onChange: (e: any) => onChange && onChange(e.target.value),
        })}
      </div>
    );
  }

  return (
    <div>
      {showLabel && labelText ? (
        <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
          {labelText}
        </label>
      ) : null}
      {inputElement({ readOnly: true })}
    </div>
  );
};
