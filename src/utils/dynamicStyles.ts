// Helpers to inject per-element CSS rules so responsive styling can be
// applied via attribute selectors like `[data-viewport="tablet"] .elem-<id>`.

type Props = Record<string, any>;

const STYLE_ID = "oneflow-dynamic-styles";

function ensureStyleElement() {
  let s = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!s) {
    s = document.createElement("style");
    s.id = STYLE_ID;
    document.head.appendChild(s);
  }
  return s;
}

function toCssProp(k: string) {
  // simple camelCase -> kebab-case
  return k.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function formatValue(v: any) {
  if (v === undefined || v === null) return "";
  // if number, assume px
  if (typeof v === "number") return `${v}px`;
  return String(v);
}

export function ensureElementStyles(id: string, props: Props) {
  if (typeof document === "undefined") return;
  const styleEl = ensureStyleElement();

  const className = `elem-${id}`;
  // Escape class selector so IDs with characters like ':' are valid in CSS selectors
  const safeClassName =
    typeof (globalThis as any).CSS !== "undefined" &&
    (globalThis as any).CSS.escape
      ? (globalThis as any).CSS.escape(className)
      : className.replace(/([^a-zA-Z0-9_-])/g, "\\$1");

  // Build base declarations and breakpoint-specific ones
  const base: Record<string, string> = {};
  const bp: Record<string, Record<string, string>> = {
    desktop: {},
    tablet: {},
    mobile: {},
  };

  const keys = [
    "width",
    "height",
    "minWidth",
    "maxWidth",
    "minHeight",
    "padding",
    "margin",
    "backgroundColor",
    "fontSize",
    "fontWeight",
    "color",
    "boxShadow",
    "objectFit",
  ];

  for (const k of keys) {
    const val = (props as any)[k];
    if (val === undefined || val === null) continue;
    if (typeof val === "object" && !Array.isArray(val)) {
      // per-breakpoint
      bp.desktop[k] = formatValue(
        val.desktop ?? val.tablet ?? val.mobile ?? ""
      );
      bp.tablet[k] = formatValue(val.tablet ?? val.mobile ?? val.desktop ?? "");
      bp.mobile[k] = formatValue(val.mobile ?? val.tablet ?? val.desktop ?? "");
    } else {
      base[k] = formatValue(val);
    }
  }

  // Handle grid-specific responsive rules (gridColumns, gridRows, minColumnWidth)
  const handleGridValue = (val: any, intoKey: string, isMinWidth = false) => {
    if (val === undefined || val === null) return;
    if (typeof val === "object" && !Array.isArray(val)) {
      bp.desktop[intoKey] = isMinWidth
        ? val.desktop ?? val.tablet ?? val.mobile ?? ""
        : val.desktop
        ? `repeat(${val.desktop}, 1fr)`
        : "";
      bp.tablet[intoKey] = isMinWidth
        ? val.tablet ?? val.mobile ?? val.desktop ?? ""
        : val.tablet
        ? `repeat(${val.tablet}, 1fr)`
        : "";
      bp.mobile[intoKey] = isMinWidth
        ? val.mobile ?? val.tablet ?? val.desktop ?? ""
        : val.mobile
        ? `repeat(${val.mobile}, 1fr)`
        : "";
    } else {
      if (isMinWidth) base[intoKey] = formatValue(val);
      else base[intoKey] = `repeat(${val}, 1fr)`;
    }
  };

  handleGridValue((props as any).gridColumns, "gridTemplateColumns", false);
  handleGridValue((props as any).gridRows, "gridTemplateRows", false);
  // minColumnWidth -> repeat(auto-fit, minmax(minColumnWidth, 1fr))
  const minCol = (props as any).minColumnWidth;
  if (minCol !== undefined && minCol !== null) {
    if (typeof minCol === "object" && !Array.isArray(minCol)) {
      bp.desktop["gridTemplateColumns"] = `repeat(auto-fit, minmax(${
        minCol.desktop ?? minCol.tablet ?? minCol.mobile
      }, 1fr))`;
      bp.tablet["gridTemplateColumns"] = `repeat(auto-fit, minmax(${
        minCol.tablet ?? minCol.mobile ?? minCol.desktop
      }, 1fr))`;
      bp.mobile["gridTemplateColumns"] = `repeat(auto-fit, minmax(${
        minCol.mobile ?? minCol.tablet ?? minCol.desktop
      }, 1fr))`;
    } else {
      base["gridTemplateColumns"] = `repeat(auto-fit, minmax(${formatValue(
        minCol
      )}, 1fr))`;
    }
  }

  // Also apply alignment and borderRadius if present
  if (props.alignment) base["textAlign"] = props.alignment;
  if (props.borderRadius)
    base["borderRadius"] = formatValue(props.borderRadius);

  // Build CSS string
  let css = "";
  // base rule
  // If no plain/base declarations were provided but we have a desktop
  // breakpoint value, use desktop as the base so desktop styles apply
  // even when `[data-viewport]` isn't set.
  if (Object.keys(base).length === 0) {
    for (const k of Object.keys(bp.desktop)) {
      if (bp.desktop[k]) base[k] = bp.desktop[k];
    }
  }

  if (Object.keys(base).length > 0) {
    css += `.${safeClassName} {\n`;
    for (const k of Object.keys(base)) {
      const prop = toCssProp(k);
      css += `  ${prop}: ${base[k]} !important;\n`;
    }
    css += `}\n`;
  }

  // breakpoint rules
  for (const bpName of ["desktop", "tablet", "mobile"]) {
    const decls = bp[bpName];
    if (!decls) continue;
    const has = Object.keys(decls).some((k) => decls[k] !== "");
    if (!has) continue;
    css += `[data-viewport="${bpName}"] .${safeClassName} {\n`;
    for (const k of Object.keys(decls)) {
      if (!decls[k]) continue;
      const prop = toCssProp(k);
      css += `  ${prop}: ${decls[k]} !important;\n`;
    }
    css += `}\n`;
  }

  // Replace existing rule for this id if present
  const marker = `/*RULE-${className}*/`;
  const old = styleEl.innerHTML || "";
  const start = old.indexOf(marker);
  if (start !== -1) {
    const endMarker = `/*END-${className}*/`;
    const end = old.indexOf(endMarker, start);
    if (end !== -1) {
      const before = old.slice(0, start);
      const after = old.slice(end + endMarker.length);
      styleEl.innerHTML = before + marker + "\n" + css + endMarker + after;
      return;
    }
  }

  // Append new rule block
  styleEl.innerHTML += `\n${marker}\n${css}/*END-${className}*/\n`;
}

export default ensureElementStyles;
