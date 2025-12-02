import React from "react";
import type { ComponentProperties } from "../../types";
import { useTheme } from "../../theme";
import { buildStyle } from "./utils";
import { useBreakpoint } from "../../hooks/useBreakpoint";

const LTCard: React.FC<{
  properties?: ComponentProperties;
  children?: React.ReactNode;
}> = ({ properties, children }) => {
  const props = properties || ({} as ComponentProperties);
  const { theme } = useTheme();
  const { breakpoint } = useBreakpoint();
  const style = buildStyle(props as any, "lt-card", breakpoint);

  const cardStyle: React.CSSProperties = {
    background: theme?.colors?.background,
    borderRadius: theme?.borderRadius?.medium ?? "8px",
    boxShadow: theme?.shadows?.medium ?? "0 4px 6px rgba(0,0,0,0.08)",
    padding: props.padding ?? "12px",
    ...((style as React.CSSProperties) || {}),
  };

  return <div style={cardStyle}>{children}</div>;
};

export default LTCard;
