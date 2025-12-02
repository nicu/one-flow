import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  value?: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  componentId?: string;
}

export const BuilderDropdown: React.FC<Props> = ({
  properties,
  value,
  onChange,
  editable,
  componentId,
}) => {
  const style = buildStyle(properties, "dropdown");
  const className = componentId ? `elem-${componentId}` : undefined;
  const opts = properties.options || [];

  if (onChange || editable) {
    return (
      <select
        id={className}
        className={className}
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
    <select id={className} className={className} style={style} disabled>
      {opts.map((opt, idx) => (
        <option key={idx}>{opt}</option>
      ))}
    </select>
  );
};
