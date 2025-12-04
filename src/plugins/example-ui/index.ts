import type { Plugin } from "../types";

const plugin: Plugin = {
  manifest: {
    id: "example.ui",
    name: "Example UI Plugin",
    version: "0.0.1",
    description: "Adds a simple side panel via plugin API",
  },
  install(ctx) {
    const unregister = ctx.ui.registerPanel("example.panel", {
      title: "Example Panel",
      position: "right",
      mount(mountPoint) {
        const root = document.createElement("div");
        root.style.padding = "12px";
        root.innerHTML = `<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
          <strong>Example Plugin</strong>
          <p style="margin:6px 0 0 0;">This panel was created by a plugin.</p>
        </div>`;
        mountPoint.appendChild(root);
        return () => mountPoint.removeChild(root);
      },
    });

    return { onUnmount: unregister };
  },
};

export default plugin;
