import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderText: React.FC<Props> = ({ properties }) => {
  const style = buildStyle(properties, "text");
  return <div style={style}>{properties.text || "Text"}</div>;
};
