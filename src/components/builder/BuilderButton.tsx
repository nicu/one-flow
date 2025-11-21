import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
  onClick?: () => void;
}

export const BuilderButton: React.FC<Props> = ({ properties, onClick }) => {
  const style = buildStyle(properties, "button");
  return (
    <button style={style} onClick={onClick}>
      {properties.buttonText || "Button"}
    </button>
  );
};
