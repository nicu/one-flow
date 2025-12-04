import type { Plugin } from "../types";
import React from "react";

const FancyCardPreview: React.FC<any> = ({
  title = "Card Title",
  showImage = true,
  image,
}) => {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        width: 220,
      }}
    >
      {showImage && (
        <div style={{ height: 100, background: "#f4f4f4", marginBottom: 8 }}>
          {image ? (
            <img
              src={image}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
      )}
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#666", fontSize: 13 }}>
        A fancy card from a plugin
      </div>
    </div>
  );
};

const plugin: Plugin = {
  manifest: {
    id: "example.component",
    name: "Example Component Plugin",
    version: "0.0.1",
    description: "Registers a sample component type `fancy-card`",
  },
  install(ctx) {
    ctx.components.registerComponent("fancy-card", {
      displayName: "Fancy Card",
      renderPreview: (props) => {
        // Render using plain DOM/mounted element approach: create wrapper and
        // return React element for preview usage in the canvas.
        return <FancyCardPreview {...props} />;
      },
      defaultProps: { title: "Hello", showImage: false },
      schema: { type: "object", properties: { title: { type: "string" } } },
    });

    // Also register a simple UI panel to demonstrate plugin UI
    const unregister = ctx.ui.registerPanel("example.component.panel", {
      title: "Example Component",
      position: "right",
      mount(mountPoint) {
        const root = document.createElement("div");
        root.style.padding = "8px";
        root.innerHTML = `<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;"><strong>Fancy Card</strong><p style=\"margin:6px 0 0 0;\">This plugin adds a Fancy Card component.</p></div>`;
        mountPoint.appendChild(root);
        return () => mountPoint.removeChild(root);
      },
    });

    return { onUnmount: unregister };
  },
};

export default plugin;
