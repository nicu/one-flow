import type { BuilderComponent, ComponentProperties } from "../types";

export const exportToReact = (components: BuilderComponent[]): string => {
  const imports = `import React from 'react';\n\n`;

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
  return JSON.stringify(components, null, 2);
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

    default:
      return `${spaces}<div${styleStr}></div>`;
  }
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
