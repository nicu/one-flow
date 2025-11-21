import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  value?: string;
  onChange?: (v: string) => void;
  editable?: boolean;
}

export const BuilderInput: React.FC<Props> = ({
  properties,
  value,
  onChange,
  editable,
}) => {
  const style = buildStyle(properties, "input");
  const inputType = properties.inputType || "text";

  if (onChange || editable) {
    return (
      <input
        type={inputType}
        placeholder={properties.placeholder || ""}
        style={style}
        value={value ?? ""}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      type={inputType}
      placeholder={properties.placeholder || ""}
      style={style}
      readOnly
    />
  );
};
