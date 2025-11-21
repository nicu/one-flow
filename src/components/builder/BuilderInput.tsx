import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderInput: React.FC<Props> = ({ properties }) => {
  const style = buildStyle(properties, "input");
  return (
    <input
      type={properties.inputType || "text"}
      placeholder={properties.placeholder || ""}
      style={style}
      readOnly
    />
  );
};
