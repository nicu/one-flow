import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTheme } from "../../theme";

const LTBox: React.FC<{
  properties?: ComponentProperties;
  children?: React.ReactNode;
}> = ({ properties, children }) => {
  const props = properties || ({} as ComponentProperties);
  const { theme } = useTheme();
  const style = buildStyle(props as any, "lt-box");
  // ensure background and spacing use theme defaults when not provided
  const mergedStyle: React.CSSProperties = {
    background: props.backgroundColor ?? theme?.colors?.background,
    padding: props.padding ?? undefined,
    ...(style as React.CSSProperties),
  };

  return <div style={mergedStyle}>{children}</div>;
};

export default LTBox;
