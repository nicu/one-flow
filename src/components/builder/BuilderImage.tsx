import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";

interface Props {
  properties: ComponentProperties;
}

export const BuilderImage: React.FC<Props> = ({ properties }) => {
  const style = buildStyle(properties, "image");
  return <img src={properties.src || ""} alt={properties.alt || ""} style={style} />;
};
