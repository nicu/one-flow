import { v4 as uuidv4 } from "uuid";
import type { BuilderComponent, ComponentType } from "../types";

const SUPPORT_TYPES: ComponentType[] = [
  "text",
  "image",
  "button",
  "input",
  "dropdown",
  "form",
  "datagrid",
  "breadcrumbs",
  "tabs",
  "chip",
  "flex",
  "grid",
  "row",
  "column",
];

function normalizeType(t: string): ComponentType {
  const lower = t.toLowerCase();
  if (SUPPORT_TYPES.includes(lower as ComponentType))
    return lower as ComponentType;
  // map common synonyms
  if (lower === "label" || lower === "text") return "text";
  if (lower === "container") return "flex";
  if (lower === "stack" || lower === "column") return "column";
  if (lower === "row") return "row";
  if (lower === "form") return "form";
  if (lower === "button") return "button";
  if (lower === "input" || lower === "textbox") return "input";
  return "text";
}

function mapStyleToProperties(style: Record<string, any>) {
  const props: Record<string, any> = {};
  if (!style) return props;
  // copy common style keys into properties used by the builder
  if (style.padding) props.padding = String(style.padding);
  if (style.margin) props.margin = String(style.margin);
  if (style.backgroundColor)
    props.backgroundColor = String(style.backgroundColor);

  // Normalize width/height: numbers -> px, numeric-strings -> px, keep units if present
  const normalizeSize = (val: any) => {
    if (val == null) return undefined;
    if (typeof val === "number") return `${val}px`;
    if (typeof val === "string") {
      const s = val.trim();
      // already has a unit like % or px or em
      if (
        /^\d+(?:\.\d+)?%$/.test(s) ||
        /px$/.test(s) ||
        /em$/.test(s) ||
        /rem$/.test(s)
      )
        return s;
      // plain numeric string -> treat as px
      if (/^\d+(?:\.\d+)?$/.test(s)) return `${s}px`;
      return s;
    }
    return String(val);
  };

  if (style.width) props.width = normalizeSize(style.width);
  if (style.height) props.height = normalizeSize(style.height);
  if (style.borderRadius) props.borderRadius = String(style.borderRadius);
  if (style.color) props.color = String(style.color);
  if (style.fontSize) props.fontSize = normalizeSize(style.fontSize);
  if (style.fontWeight) props.fontWeight = String(style.fontWeight);
  if (style.gap) props.gap = String(style.gap);
  if (style.flexDirection) props.flexDirection = style.flexDirection;
  if (style.justifyContent) props.justifyContent = style.justifyContent;
  if (style.alignItems) props.alignItems = style.alignItems;
  if (style.boxShadow) props.boxShadow = style.boxShadow;
  return props;
}

function convertNode(node: any): BuilderComponent {
  const type = normalizeType(node.type || "text");
  const id = uuidv4();
  const incomingProps = (node.props || {}) as Record<string, any>;

  const properties: Record<string, any> = {};

  // map primitive content
  if (type === "text") {
    properties.text = incomingProps.content ?? incomingProps.text ?? "";
    if (incomingProps.fontSize)
      properties.fontSize = String(incomingProps.fontSize);
    if (incomingProps.color) properties.color = incomingProps.color;
    if (incomingProps.fontWeight)
      properties.fontWeight = incomingProps.fontWeight;
  }

  if (type === "button") {
    properties.buttonText =
      incomingProps.content ??
      incomingProps.text ??
      incomingProps.buttonText ??
      "Button";
    if (incomingProps.style?.backgroundColor)
      properties.buttonColor = incomingProps.style.backgroundColor;
    if (incomingProps.style?.color)
      properties.buttonTextColor = incomingProps.style.color;
  }

  if (type === "input") {
    properties.placeholder =
      incomingProps.placeholder ?? incomingProps.props?.placeholder ?? "";
    properties.inputType =
      incomingProps.type ?? incomingProps.inputType ?? "text";
    if (incomingProps.label) properties.label = incomingProps.label;
  }

  if (type === "image") {
    const src =
      incomingProps.src ?? incomingProps.url ?? incomingProps.props?.src;
    properties.alt = incomingProps.alt ?? "";
    // Use the original image URL directly. Do not rewrite to a local proxy.
    // Keep the incoming src value as-is (it may be an absolute URL or a path).
    properties.src = src;
  }

  // copy style block into properties where applicable
  const styleProps =
    incomingProps.style ??
    incomingProps.props?.style ??
    incomingProps.props ??
    {};
  Object.assign(properties, mapStyleToProperties(styleProps));

  // Fallback: if incoming contains 'content' and no mapping applied, set text
  if (!properties.text && incomingProps.content && type === "text") {
    properties.text = incomingProps.content;
  }

  // children
  const childrenNodes: BuilderComponent[] = [];
  // Accept children from common locations the model may use: `children`,
  // `components`, or nested under `props`/`props.style` etc. This makes the
  // converter robust to different JSON shapes returned by various models.
  const rawChildren =
    node.children ||
    node.components ||
    node.props?.children ||
    node.props?.components ||
    [];
  for (const child of rawChildren) {
    if (typeof child === "string") {
      childrenNodes.push({
        id: uuidv4(),
        type: "text",
        properties: { text: child },
      });
    } else if (child && typeof child === "object") {
      childrenNodes.push(convertNode(child));
    }
  }

  const builder: BuilderComponent = {
    id,
    type: type,
    properties,
    // Attach children for any node that has them. The renderer will decide
    // whether to treat the node as a layout container or render children
    // inline. This ensures generated trees aren't lost simply because the
    // node type isn't a known layout type.
    children: childrenNodes.length > 0 ? childrenNodes : undefined,
  };

  return builder;
}

export function aiToBuilder(root: any): BuilderComponent[] {
  if (!root) return [];
  // If root is an array
  if (Array.isArray(root)) {
    return root.map((r) => convertNode(r));
  }
  // If root has type "fragment" and children
  if (root.type === "fragment" && Array.isArray(root.children)) {
    return root.children.map((c: any) => convertNode(c));
  }
  // single node
  // Heuristic: if the model returned a single top-level layout wrapper
  // (e.g. a full-page `flex` with width:100% and multiple section children),
  // unwrap and return its children as top-level components so the Layers
  // panel shows each major section separately.
  try {
    const topType = String((root.type || "").toLowerCase());
    const style = (root.props && root.props.style) || root.style || {};
    const width = style.width || "";
    if (
      ["flex", "column", "row"].includes(topType) &&
      Array.isArray(root.children) &&
      root.children.length > 0 &&
      (String(width).trim() === "100%" || String(width).trim() === "100")
    ) {
      return root.children.map((c: any) => convertNode(c));
    }
  } catch {
    // ignore and fall back to single node
  }

  return [convertNode(root)];
}

export default aiToBuilder;
