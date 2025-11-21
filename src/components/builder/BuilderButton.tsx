import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderButton: React.FC<Props> = ({ properties }) => {
  const style = buildStyle(properties, "button");
  return <button style={style}>{properties.buttonText || "Button"}</button>;
};
