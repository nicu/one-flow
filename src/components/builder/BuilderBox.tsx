import React from "react";
import type { ComponentProperties } from "../../types";
import { buildStyle } from "./utils";
import { useTheme } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const BuilderBox: React.FC<{
  properties?: ComponentProperties;
  children?: React.ReactNode;
  componentId?: string;
}> = ({ properties, children, componentId }) => {
  const props = properties || ({} as ComponentProperties);
  const { theme } = useTheme();
  const { breakpoint } = useBreakpoint();
  const style = buildStyle(props as any, "box", breakpoint);

  const mergedStyle: React.CSSProperties = {
    background: props.backgroundColor ?? theme?.colors?.background,
    padding: props.padding ?? undefined,
    ...(style as React.CSSProperties),
  };

  const className = componentId ? `elem-${componentId}` : undefined;

  return (
    <div id={className} className={className} style={mergedStyle}>
      {children}
    </div>
  );
};

export default BuilderBox;
