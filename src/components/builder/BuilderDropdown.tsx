import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderDropdown: React.FC<Props> = ({ properties }) => {
  const style = buildStyle(properties, "dropdown");
  return (
    <select style={style} disabled>
      {(properties.options || []).map((opt, idx) => (
        <option key={idx}>{opt}</option>
      ))}
    </select>
  );
};
