import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  value?: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  showLabel?: boolean;
}

export const BuilderInput: React.FC<Props> = ({
  properties,
  value,
  onChange,
  editable,
  showLabel = true,
}) => {
  const style = buildStyle(properties, "input");
  const inputType = properties.inputType || "text";
  const inputElement = (props: any) => (
    <input
      type={inputType}
      placeholder={properties.placeholder || ""}
      style={style}
      {...props}
    />
  );

  const labelText = properties.label;

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
