import type { ComponentProperties, ComponentType } from "../../types";
import { theme } from "../../theme";

export const buildStyle = (
  props: ComponentProperties,
  type: ComponentType
): React.CSSProperties => {
  const style: React.CSSProperties = {};

  // Common
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  if (props.minHeight) style.minHeight = props.minHeight;
  if (props.padding) style.padding = props.padding;
  if (props.margin) style.margin = props.margin;
  if (props.backgroundColor) style.backgroundColor = props.backgroundColor;

  // Typography
  if (props.fontSize) style.fontSize = props.fontSize;
  if (props.fontWeight) style.fontWeight = props.fontWeight;
  if (props.color) style.color = props.color;

  // New properties
  if (props.boxShadow) style.boxShadow = props.boxShadow;
  if (props.objectFit) style.objectFit = props.objectFit;

  // Border Radius logic
  if (props.borderRadius) {
    style.borderRadius = props.borderRadius;
  } else {
    // Defaults from theme
    if (type === "button") style.borderRadius = theme.borderRadius.button;
    if (type === "input") style.borderRadius = theme.borderRadius.input;
    // if (type === 'image') style.borderRadius = theme.borderRadius.medium;
  }

  // Type specific defaults
  if (type === "button") {
    const variant = (props as any).buttonVariant || "contained";
    const btnColor = props.buttonColor || theme.colors.primary;
    const btnText = props.buttonTextColor || "#ffffff";
    if (variant === "outlined") {
      style.backgroundColor = "#ffffff";
      style.color = props.buttonTextColor || btnColor;
      style.border = `1px solid ${btnColor}`;
      style.boxShadow = "none";
    } else {
      style.backgroundColor = btnColor;
      style.color = btnText;
      style.border = "none";
      style.boxShadow = props.boxShadow || theme.shadows.small;
    }
    style.cursor = "pointer";
    style.fontFamily = theme.typography.fontFamily;
    style.fontWeight = 600;
    style.letterSpacing = "0.2px";
    style.textTransform = "none";
    // Default padding for buttons if not set
    if (!props.padding) style.padding = "8px 16px";
    if (!props.fontSize) style.fontSize = theme.typography.fontSize.base;
    if (!props.borderRadius) style.borderRadius = theme.borderRadius.button;
  }

  if (type === "input" || type === "dropdown") {
    style.border = `1px solid ${theme.colors.border}`;
    style.fontFamily = theme.typography.fontFamily;
    if (!props.padding) style.padding = "8px 12px";
    if (!props.fontSize) style.fontSize = theme.typography.fontSize.base;
    style.outline = "none";
    if (!props.borderRadius) style.borderRadius = theme.borderRadius.input;
  }

  if (type === "text") {
    style.fontFamily = theme.typography.fontFamily;
    if (!props.fontSize) style.fontSize = theme.typography.fontSize.base;
  }

  if (props.alignment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style.textAlign = props.alignment as any;
  }

  // Layout styles
  if (type === "flex" || type === "row" || type === "column") {
    style.display = "flex";
    style.flexDirection =
      props.flexDirection || (type === "column" ? "column" : "row");
    if (props.gap) style.gap = props.gap;
    if (props.justifyContent) style.justifyContent = props.justifyContent;
    if (props.alignItems) style.alignItems = props.alignItems;
    if (props.flexWrap) style.flexWrap = props.flexWrap;
  }

  if (type === "grid") {
    style.display = "grid";
    if (props.minColumnWidth) {
      // Responsive grid logic: repeat(auto-fit, minmax(minColumnWidth, 1fr))
      style.gridTemplateColumns = `repeat(auto-fit, minmax(${props.minColumnWidth}, 1fr))`;
    } else if (props.gridColumns) {
      style.gridTemplateColumns = `repeat(${props.gridColumns}, 1fr)`;
    }
    if (props.gridRows) {
      style.gridTemplateRows = `repeat(${props.gridRows}, 1fr)`;
    }
    if (props.gap) style.gap = props.gap;
  }

  return style;
};
