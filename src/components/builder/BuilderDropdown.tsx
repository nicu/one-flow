import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  value?: string;
  onChange?: (v: string) => void;
  editable?: boolean;
}

export const BuilderDropdown: React.FC<Props> = ({
  properties,
  value,
  onChange,
  editable,
}) => {
  const style = buildStyle(properties, "dropdown");
  const opts = properties.options || [];

  if (onChange || editable) {
    return (
      <select
        style={style}
        value={value ?? ""}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        <option value="">--</option>
        {opts.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select style={style} disabled>
      {opts.map((opt, idx) => (
        <option key={idx}>{opt}</option>
      ))}
    </select>
  );
};
