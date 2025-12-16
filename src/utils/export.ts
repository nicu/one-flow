import type { BuilderComponent, ComponentProperties } from "../types";
import { componentRegistry } from "../plugins/registry";

export const exportToReact = (components: BuilderComponent[]): string => {
  const importLines: string[] = ["import React from 'react';"];

  // add component-specific imports
  if (components.some((c) => String(c.type) === "image-grid")) {
    importLines.push("import ImageGrid from './components/ImageGrid';");
  }

  const imports = importLines.join("\n") + "\n\n";

  const componentCode = `export const GeneratedPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
${components.map((c) => renderComponent(c, 3)).join("\n")}
    </div>
  );
};\n`;

  return imports + componentCode;
};

export const exportToJSON = (components: BuilderComponent[]): string => {
  // Include absolute position hints when available (left/top/width/height)
  const parsePx = (v: any): number | undefined => {
    if (v == null) return undefined;
    if (typeof v === "number") return v;
    const s = String(v).trim();
    const m = s.match(/^([0-9.]+)px$/);
    if (m) return parseFloat(m[1]);
    if (/^[0-9.]+$/.test(s)) return parseFloat(s);
    return undefined;
  };

  const transform = (c: BuilderComponent): BuilderComponent => {
    const copy: BuilderComponent = {
      id: c.id,
      type: c.type,
      properties: { ...(c.properties || {}) },
    };
    // attach absolute coordinates if the component uses absolute positioning
    try {
      const pos = copy.properties.position;
      const left = parsePx(copy.properties.left);
      const top = parsePx(copy.properties.top);
      const width = parsePx(copy.properties.width);
      const height = parsePx(copy.properties.height);
      if (
        pos === "absolute" ||
        (left != null && top != null) ||
        width != null ||
        height != null
      ) {
        // add a lightweight `absolute` hint object consumed by the Figma importer
        // keep numbers only when parseable
        (copy as any).absolute = {};
        if (left != null) (copy as any).absolute.x = left;
        if (top != null) (copy as any).absolute.y = top;
        if (width != null) (copy as any).absolute.width = width;
        if (height != null) (copy as any).absolute.height = height;
      }
    } catch {}

    if (c.children && c.children.length) {
      copy.children = c.children.map(transform);
    }
    return copy;
  };

  const out = components.map(transform);

  // Layout pass: ensure every node has an `absolute` hint with numeric width/height
  const parseGap = (v: any) => {
    const px = parsePx(v);
    if (px != null) return px;
    if (typeof v === "string") {
      const parts = v.split(" ").map((s) => s.trim());
      for (const p of parts) {
        const n = parsePx(p);
        if (n != null) return n;
      }
    }
    return 0;
  };

  const estimateTextSize = (props: ComponentProperties | undefined) => {
    const txt = (props && (props.text || "")) || "";
    const fontSize = parsePx(props?.fontSize) || 14;
    const lines = txt.split("\n").length || 1;
    const height = Math.ceil(fontSize * 1.2 * lines);
    const approxCharWidth = Math.max(6, fontSize * 0.5);
    const width = Math.ceil((txt.length || 8) * approxCharWidth);
    return { width, height };
  };

  const layoutNode = (node: BuilderComponent, isRoot = false) => {
    // recurse children first
    const children = node.children || [];
    children.forEach((ch) => layoutNode(ch));

    const props = node.properties || ({} as ComponentProperties);
    const pad =
      (props.padding &&
        String(props.padding)
          .split(" ")
          .map((s) => parsePx(s) || 0)) ||
      [];
    const paddingTop = pad.length === 1 ? pad[0] || 0 : pad[0] || 0;
    const paddingRight = pad.length === 2 ? pad[1] || 0 : pad[1] || 0;
    const paddingBottom = pad.length === 4 ? pad[2] || 0 : pad[2] || 0;
    const paddingLeft = pad.length === 4 ? pad[3] || 0 : pad[3] || 0;

    const gap = parseGap(props.gap);

    // prefer explicit width/height hints
    const explicitW = parsePx(props.width);
    const explicitH = parsePx(props.height) || parsePx(props.minHeight);

    let width: number | undefined = explicitW != null ? explicitW : undefined;
    let height: number | undefined = explicitH != null ? explicitH : undefined;

    // treat percentage widths on root as a desktop width
    if (
      isRoot &&
      typeof props.width === "string" &&
      props.width.trim().endsWith("%")
    ) {
      width = 1200;
    }

    // Type-specific heuristics
    switch (String(node.type)) {
      case "text": {
        const est = estimateTextSize(props);
        if (width == null) width = est.width;
        if (height == null) height = est.height;
        break;
      }
      case "image": {
        const estH =
          parsePx(props.height) ||
          ((props as any).absolute && (props as any).absolute.height);
        if (height == null && estH != null) height = estH;
        if (height == null) height = 120;
        if (width == null) width = parsePx(props.width) || 200;
        break;
      }
      case "flex":
      case "column": {
        // vertical stacking
        const childWidths = children
          .map((ch) => (ch as any).absolute?.width)
          .filter(Boolean) as number[];
        const childHeights = children.map(
          (ch) => (ch as any).absolute?.height || 0
        ) as number[];
        const totalHeight =
          childHeights.reduce((s, v) => s + v, 0) +
          Math.max(0, children.length - 1) * gap;
        const maxChildWidth = childWidths.length
          ? Math.max(...childWidths)
          : undefined;
        if (height == null) height = totalHeight + paddingTop + paddingBottom;
        if (width == null)
          width =
            maxChildWidth != null
              ? maxChildWidth + paddingLeft + paddingRight
              : undefined;
        break;
      }
      case "row": {
        const childWidths = children.map(
          (ch) => (ch as any).absolute?.width || 0
        ) as number[];
        const childHeights = children
          .map((ch) => (ch as any).absolute?.height)
          .filter(Boolean) as number[];
        const totalWidth =
          childWidths.reduce((s, v) => s + v, 0) +
          Math.max(0, children.length - 1) * gap;
        const maxChildHeight = childHeights.length
          ? Math.max(...childHeights)
          : undefined;
        if (width == null) width = totalWidth + paddingLeft + paddingRight;
        if (height == null)
          height =
            maxChildHeight != null
              ? maxChildHeight + paddingTop + paddingBottom
              : undefined;
        break;
      }
      case "grid": {
        const cols = (props.gridColumns && Number(props.gridColumns)) || 3;
        const minCol = parsePx(props.minColumnWidth) || 120;
        const childHeights = children.map(
          (ch) => (ch as any).absolute?.height || 120
        ) as number[];
        const rows = Math.ceil(children.length / cols) || 1;
        const rowHeights: number[] = [];
        for (let r = 0; r < rows; r++) {
          const start = r * cols;
          const rowMax = Math.max(...childHeights.slice(start, start + cols));
          rowHeights.push(rowMax || 120);
        }
        const totalHeight =
          rowHeights.reduce((s, v) => s + v, 0) + Math.max(0, rows - 1) * gap;
        if (width == null)
          width = cols * minCol + paddingLeft + paddingRight + (cols - 1) * gap;
        if (height == null) height = totalHeight + paddingTop + paddingBottom;
        break;
      }
      default: {
        const childWidths = children
          .map((ch) => (ch as any).absolute?.width)
          .filter(Boolean) as number[];
        const childHeights = children.map(
          (ch) => (ch as any).absolute?.height || 0
        ) as number[];
        if (height == null && childHeights.length)
          height = Math.max(...childHeights) + paddingTop + paddingBottom;
        if (width == null && childWidths.length)
          width = Math.max(...childWidths) + paddingLeft + paddingRight;
        break;
      }
    }

    // final fallbacks
    if (width == null) width = 300;
    if (height == null) height = 120;

    // attach absolute if not present
    (node as any).absolute = (node as any).absolute || {};
    if ((node as any).absolute.x == null)
      (node as any).absolute.x = (node as any).absolute.x || 0;
    if ((node as any).absolute.y == null)
      (node as any).absolute.y = (node as any).absolute.y || 0;
    (node as any).absolute.width = Math.ceil(width);
    (node as any).absolute.height = Math.ceil(height);
  };

  // First compute estimated layout
  out.forEach((n) => layoutNode(n, true));

  // Try to measure actual DOM elements in the canvas and prefer those
  // dimensions/positions when available (use scrollWidth/scrollHeight for full page).
  try {
    if (typeof document !== "undefined") {
      const rootEl = document.querySelector(".canvas") as HTMLElement | null;
      const rootRect = rootEl ? rootEl.getBoundingClientRect() : null;
      const pageW = rootEl
        ? rootEl.scrollWidth || (rootRect ? rootRect.width : undefined)
        : undefined;
      const pageH = rootEl
        ? rootEl.scrollHeight || (rootRect ? rootRect.height : undefined)
        : undefined;

      // If we measured a full page size, prefer it for top-level nodes
      if (pageW != null || pageH != null) {
        out.forEach((node) => {
          (node as any).absolute = (node as any).absolute || {};
          if (pageW != null) (node as any).absolute.width = Math.round(pageW);
          if (pageH != null) (node as any).absolute.height = Math.round(pageH);
        });
      }

      const scrollLeft = rootEl ? rootEl.scrollLeft || 0 : 0;
      const scrollTop = rootEl ? rootEl.scrollTop || 0 : 0;

      const measureNode = (node: BuilderComponent) => {
        const elId = `elem-${node.id}`;
        const el: Element | null =
          document.getElementById(elId) || document.querySelector(`.${elId}`);
        if (el && rootRect) {
          const r = (el as HTMLElement).getBoundingClientRect();
          (node as any).absolute = (node as any).absolute || {};
          (node as any).absolute.x = Math.round(
            r.left - rootRect.left + scrollLeft
          );
          (node as any).absolute.y = Math.round(
            r.top - rootRect.top + scrollTop
          );
          (node as any).absolute.width = Math.round(r.width);
          (node as any).absolute.height = Math.round(r.height);
        }
        if (node.children && node.children.length)
          node.children.forEach(measureNode);
      };

      out.forEach((n) => measureNode(n));
    }
  } catch (e) {
    // measurement is best-effort; ignore failures
  }

  // Copy measured absolute values back into properties as pixel values
  const writeBackProperties = (node: BuilderComponent) => {
    const abs = (node as any).absolute;
    node.properties = node.properties || ({} as ComponentProperties);
    if (abs) {
      if (abs.width != null) node.properties.width = `${abs.width}px`;
      if (abs.height != null) node.properties.height = `${abs.height}px`;
      if (abs.x != null) node.properties.left = `${abs.x}px`;
      if (abs.y != null) node.properties.top = `${abs.y}px`;
    }
    if (node.children && node.children.length)
      node.children.forEach(writeBackProperties);
  };

  out.forEach((n) => writeBackProperties(n));

  return JSON.stringify(out, null, 2);
};

export const exportToHTML = (components: BuilderComponent[]): string => {
  // Simple HTML document generator that inlines styles as style="..."
  const normalize = (v: any) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "number") return `${v}px`;
    return String(v);
  };

  const defaultCSS = `
.of-image-grid { box-sizing: border-box; }
.of-image-grid-title { margin-bottom: 8px; font-weight: 600; }
.of-image-grid { width: 100%; }
.of-image-grid .of-image-item { position: relative; overflow: hidden; min-height: 120px; }
.of-image-grid .of-image-img { width: 100%; display: block; }
.of-image-grid .of-image-overlay { position: absolute; inset: 0; display: flex; }
.of-image-grid .of-image-overlay .label { background: rgba(0,0,0,0.5); color: #fff; padding: 6px 8px; border-radius: 6px; pointer-events: auto; font-weight: 600; font-size: 14px; }
`;
  const renderStyleAttr = (styleObj: Record<string, string> | undefined) => {
    if (!styleObj || Object.keys(styleObj).length === 0) return "";
    return Object.entries(styleObj)
      .map(
        ([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`
      )
      .join(";");
  };

  const renderHTML = (component: BuilderComponent): string => {
    const styleObj = buildStyleObject(component.properties);
    const styleAttr = renderStyleAttr(styleObj);

    switch (component.type) {
      case "text":
        return `<div style=\"${styleAttr}\">${
          component.properties.text || ""
        }</div>`;
      case "image":
        // ensure object-fit default
        if (!styleObj.objectFit) styleObj.objectFit = "cover";
        const imgStyle = renderStyleAttr(styleObj);
        return `<img src=\"${component.properties.src || ""}\" alt=\"${
          component.properties.alt || ""
        }\" style=\"${imgStyle}\"/>`;
      case "button":
        return `<button style=\"${styleAttr}\">${
          component.properties.buttonText || "Button"
        }</button>`;
      case "input":
        return `<input type=\"${
          component.properties.inputType || "text"
        }\" placeholder=\"${
          component.properties.placeholder || ""
        }\" style=\"${styleAttr}\" />`;
      case "dropdown": {
        const options = component.properties.options || [];
        return `<select style=\"${styleAttr}\">${options
          .map((o) => `<option>${o}</option>`)
          .join("")}</select>`;
      }
      case "flex":
      case "row":
      case "column":
      case "grid": {
        const children = component.children || [];
        if (children.length === 0) return `<div style=\"${styleAttr}\"></div>`;
        return `<div style=\"${styleAttr}\">${children
          .map((c) => renderHTML(c))
          .join("")}</div>`;
      }
      case "image-grid": {
        // Merge registered defaults with stored properties so export matches preview
        const registered = componentRegistry.getComponent(
          String(component.type)
        );
        const props = {
          ...(registered?.defaultProps || {}),
          ...(component.properties || {}),
        } as any;
        const cols = (() => {
          const g = props.gridColumns;
          if (!g) return 3;
          if (typeof g === "number") return g;
          return g.desktop || g.tablet || g.mobile || 3;
        })();

        const gridStyle: Record<string, string> = {
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: props.gap || "12px",
          width: props.width || "100%",
        };

        // If no items provided, use sample placeholders matching the runtime component
        const items =
          props.items && Array.isArray(props.items) && props.items.length > 0
            ? props.items
            : [
                {
                  id: "1",
                  title: "Sample A",
                  image: "https://picsum.photos/300/200?random=1",
                },
                {
                  id: "2",
                  title: "Sample B",
                  image: "https://picsum.photos/300/200?random=2",
                },
                {
                  id: "3",
                  title: "Sample C",
                  image: "https://picsum.photos/300/200?random=3",
                },
              ];

        const title = props.title
          ? `<div class="of-image-grid-title">${props.title}</div>`
          : "";

        const itemsHtml = items
          .map((it: any) => {
            const imgSrc =
              it && props.itemImageField
                ? it[props.itemImageField] || ""
                : it?.image || "";
            const imgTitle =
              it && props.itemTitleField
                ? it[props.itemTitleField] || ""
                : it?.title || "";
            const br = normalize(props.borderRadius || 8);
            const imgH = normalize(props.imageHeight || 180);
            const objFit = props.objectFit || "cover";

            const overlayJustify = (() => {
              // center-center default; support common positions
              const pos = (props.imagePosition || "center-center").split("-");
              const h = pos[1] || "center";
              const v = pos[0] || "center";
              const justifyMap: Record<string, string> = {
                left: "flex-start",
                center: "center",
                right: "flex-end",
              };
              const alignMap: Record<string, string> = {
                top: "flex-start",
                center: "center",
                bottom: "flex-end",
              };
              return `justify-content:${
                justifyMap[h] || "center"
              };align-items:${alignMap[v] || "center"}`;
            })();

            return `<div class="of-image-item" style="border-radius:${br};min-height:120px"><img class="of-image-img" src="${imgSrc}" alt="${imgTitle}" style="height:${imgH};object-fit:${objFit};"/>${
              imgTitle
                ? `<div class="of-image-overlay" style="${overlayJustify}"><div class="label">${imgTitle}</div></div>`
                : ""
            }</div>`;
          })
          .join("");

        const gridStyleAttr = Object.entries(gridStyle)
          .map(
            ([k, v]) =>
              `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`
          )
          .join(";");

        return `<div class="of-image-grid" style="${gridStyleAttr}">${title}${itemsHtml}</div>`;
      }
      default:
        return `<div style=\"${styleAttr}\"></div>`;
    }
  };

  const body = components.map((c) => renderHTML(c)).join("");

  return `<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Exported Page</title>\n<style>${defaultCSS}</style>\n</head>\n<body style=\"padding:20px;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial\">\n${body}\n</body>\n</html>`;
};

const renderComponent = (
  component: BuilderComponent,
  indent: number
): string => {
  const spaces = " ".repeat(indent);
  const style = buildStyleObject(component.properties);
  const styleStr =
    Object.keys(style).length > 0 ? ` style={${JSON.stringify(style)}}` : "";

  switch (component.type) {
    case "text":
      return `${spaces}<div${styleStr}>${
        component.properties.text || ""
      }</div>`;

    case "image":
      // Ensure exported images default to objectFit: 'cover' when not specified
      if (!Object.prototype.hasOwnProperty.call(style, "objectFit")) {
        style.objectFit = "cover";
      }
      const styleStrWithFit =
        Object.keys(style).length > 0
          ? ` style={${JSON.stringify(style)}}`
          : "";
      return `${spaces}<img src="${component.properties.src || ""}" alt="${
        component.properties.alt || ""
      }"${styleStrWithFit} />`;

    case "button":
      return `${spaces}<button${styleStr}>${
        component.properties.buttonText || "Button"
      }</button>`;

    case "input":
      return `${spaces}<input type="${
        component.properties.inputType || "text"
      }" placeholder="${component.properties.placeholder || ""}"${styleStr} />`;

    case "dropdown": {
      const options = component.properties.options || [];
      return `${spaces}<select${styleStr}>\n${options
        .map((opt) => `${spaces}  <option>${opt}</option>`)
        .join("\n")}\n${spaces}</select>`;
    }

    case "flex":
    case "row":
    case "column":
    case "grid": {
      const children = component.children || [];
      if (children.length === 0) {
        return `${spaces}<div${styleStr}></div>`;
      }
      return `${spaces}<div${styleStr}>\n${children
        .map((c) => renderComponent(c, indent + 2))
        .join("\n")}\n${spaces}</div>`;
    }

    case "image-grid": {
      return renderImageGrid(component, indent);
    }

    default:
      return `${spaces}<div${styleStr}></div>`;
  }
};

// Helper to render ImageGrid-like components as a component usage
const renderImageGrid = (component: BuilderComponent, indent: number) => {
  const spaces = " ".repeat(indent);
  // Merge any registered defaultProps from the component registry with the
  // saved properties on the component so exports include sensible defaults
  const registered = componentRegistry.getComponent(String(component.type));
  const props = {
    ...(registered?.defaultProps || {}),
    ...(component.properties || {}),
  } as ComponentProperties;

  // Serialize properties to a JS object literal string
  const propsStr = JSON.stringify(props, null, 2)
    // indent each line to match desired indentation inside JSX
    .split("\n")
    .map((line, i) => (i === 0 ? line : `\n${spaces}${line}`))
    .join("");

  return `${spaces}<ImageGrid properties={${propsStr}} />`;
};

const buildStyleObject = (
  properties?: ComponentProperties
): Record<string, string> => {
  const style: Record<string, string> = {};
  if (!properties) return style;

  if (properties.width) style.width = properties.width;
  if (properties.height) style.height = properties.height;
  if (properties.minHeight) style.minHeight = properties.minHeight;
  if (properties.padding) style.padding = properties.padding;
  if (properties.margin) style.margin = properties.margin;
  if (properties.backgroundColor)
    style.backgroundColor = properties.backgroundColor;
  if (properties.fontSize) style.fontSize = properties.fontSize;
  if (properties.fontWeight) style.fontWeight = properties.fontWeight;
  if (properties.color) style.color = properties.color;
  if (properties.buttonColor) style.backgroundColor = properties.buttonColor;
  if (properties.buttonTextColor) style.color = properties.buttonTextColor;

  if (properties.alignment) {
    switch (properties.alignment) {
      case "left":
        style.textAlign = "left";
        break;
      case "center":
        style.textAlign = "center";
        break;
      case "right":
        style.textAlign = "right";
        break;
    }
  }

  // Layout properties
  if (
    properties.flexDirection ||
    properties.gap ||
    properties.justifyContent ||
    properties.alignItems
  ) {
    style.display = "flex";
    if (properties.flexDirection)
      style.flexDirection = properties.flexDirection;
    if (properties.gap) style.gap = properties.gap;
    if (properties.justifyContent)
      style.justifyContent = properties.justifyContent;
    if (properties.alignItems) style.alignItems = properties.alignItems;
  }

  if (properties.gridColumns || properties.gridRows) {
    style.display = "grid";
    if (properties.gridColumns)
      style.gridTemplateColumns = `repeat(${properties.gridColumns}, 1fr)`;
    if (properties.gridRows)
      style.gridTemplateRows = `repeat(${properties.gridRows}, 1fr)`;
    if (properties.gap) style.gap = properties.gap;
  }

  return style;
};
