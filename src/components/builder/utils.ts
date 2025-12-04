import type { ComponentProperties } from "../../types";
import { theme } from "../../theme";
import {
  getResponsiveValue,
  getCurrentBreakpoint,
} from "../../utils/responsive";

export const buildStyle = (
  props: ComponentProperties,
  type: string,
  breakpoint?: string
): React.CSSProperties => {
  // Defensive: if props is undefined/null, return empty style
  if (!props) return {} as React.CSSProperties;

  const bp = (breakpoint as any) ?? getCurrentBreakpoint();

  const style: React.CSSProperties = {};

  const r = <T>(v?: T | Record<string, any>) =>
    getResponsiveValue<T>(v as any, bp as any);

  // Common (resolve responsive values)
  if (r(props.width)) style.width = r(props.width) as any;
  if (r(props.height)) style.height = r(props.height) as any;
  if (r(props.minWidth)) style.minWidth = r(props.minWidth) as any;
  if (r(props.maxWidth)) style.maxWidth = r(props.maxWidth) as any;
  if (r(props.minHeight)) style.minHeight = r(props.minHeight) as any;
  if (r(props.padding)) style.padding = r(props.padding) as any;
  if (r(props.margin)) style.margin = r(props.margin) as any;
  if (r(props.backgroundColor))
    style.backgroundColor = r(props.backgroundColor) as any;

  // Typography
  if (r(props.fontSize)) style.fontSize = r(props.fontSize) as any;
  if (r(props.fontWeight)) style.fontWeight = r(props.fontWeight) as any;
  if (r(props.color)) style.color = r(props.color) as any;

  // New properties
  if (r(props.boxShadow)) style.boxShadow = r(props.boxShadow) as any;
  if (r(props.objectFit)) style.objectFit = r(props.objectFit) as any;
  if (r((props as any).aspectRatio))
    style.aspectRatio = r((props as any).aspectRatio) as any;

  // Border Radius logic
  if (r(props.borderRadius)) {
    style.borderRadius = r(props.borderRadius) as any;
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
    // Inputs and dropdowns should fill their parent by default
    if (!props.width && !style.width) {
      style.width = "100%";
    }
  }

  if (type === "text") {
    style.fontFamily = theme.typography.fontFamily;
    if (!props.fontSize) style.fontSize = theme.typography.fontSize.base;
  }

  // Image defaults: make images block-level and responsive so they
  // naturally fill their grid cell without overflowing.
  if (type === "image") {
    if (!style.display) style.display = "block";
    if (!props.width && !style.width) style.width = "100%" as any;
    if (!props.maxWidth) style.maxWidth = "100%";
    // Default objectFit to 'cover' for images unless explicitly provided
    if (!style.objectFit) style.objectFit = "cover" as any;
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
    if (r(props.gap)) style.gap = r(props.gap) as any;
    if (r(props.justifyContent))
      style.justifyContent = r(props.justifyContent) as any;
    if (r(props.alignItems)) style.alignItems = r(props.alignItems) as any;
    if (r(props.flexWrap)) style.flexWrap = r(props.flexWrap) as any;
    // Prevent intrinsic sizing from expanding grid columns: allow
    // these layout containers to shrink and default to filling their
    // available grid cell width.
    if (!props.minWidth && style.minWidth === undefined) {
      style.minWidth = 0 as any;
    }
    if (!props.width && style.width === undefined) {
      style.width = "100%" as any;
    }
  }

  if (type === "grid") {
    style.display = "grid";
    // Ensure the grid container itself fills its parent width by default.
    if (!props.width && style.width === undefined) style.width = "100%" as any;

    // If the user explicitly requests fixed columns, prefer `gridColumns`
    // even when `minColumnWidth` is present. Otherwise, follow the
    // responsive/default behavior (minColumnWidth -> gridColumns).
    // Resolve responsive values for grid columns/rows/minColumnWidth
    const resolvedGridColumns = r(props.gridColumns) as any;
    const resolvedGridRows = r(props.gridRows) as any;
    const resolvedMinColumnWidth = r(props.minColumnWidth) as any;

    const useFixed = !!(props.useFixedColumns && resolvedGridColumns);
    if (!useFixed && resolvedMinColumnWidth) {
      // Responsive grid logic: repeat(auto-fit, minmax(minColumnWidth, 1fr))
      style.gridTemplateColumns = `repeat(auto-fit, minmax(${resolvedMinColumnWidth}, 1fr))`;
    } else if (resolvedGridColumns) {
      style.gridTemplateColumns = `repeat(${resolvedGridColumns}, 1fr)`;
    }
    if (resolvedGridRows) {
      style.gridTemplateRows = `repeat(${resolvedGridRows}, 1fr)`;
    }
    if (r(props.gap)) style.gap = r(props.gap) as any;
    // Grid alignment helpers
    if (props.justifyItems) style.justifyItems = props.justifyItems as any;
    // alignItems maps to CSS `align-items` for grid as well
    if (props.alignItems) style.alignItems = props.alignItems as any;
    if (props.justifyContent)
      style.justifyContent = props.justifyContent as any;
    if (props.alignContent) style.alignContent = props.alignContent as any;
  }

  return style;
};
