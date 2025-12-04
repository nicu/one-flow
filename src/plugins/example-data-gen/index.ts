import type { Plugin } from "../types";

const plugin: Plugin = {
  manifest: {
    id: "example.data.gen",
    name: "Example Data Generator",
    version: "0.0.1",
    description: "Provides a simple random user generator",
  },
  install(ctx) {
    ctx.data.registerGenerator("randomUser", {
      displayName: "Random User",
      async generate(_schema, _options) {
        const id = Math.random().toString(36).slice(2);
        // Provide a sample avatar using pravatar (stable per id)
        const avatar = `https://i.pravatar.cc/150?u=${id}`;
        return {
          id,
          name: `User ${Math.floor(Math.random() * 1000)}`,
          email: `${id}@example.com`,
          avatar,
        };
      },
    });

    const unregister = ctx.ui.registerPanel("example.data.gen.panel", {
      title: "Data Generators",
      position: "right",
      mount(mountPoint) {
        const root = document.createElement("div");
        root.style.padding = "8px";
        const btn = document.createElement("button");
        btn.textContent = "Generate Random User (logs)";
        btn.onclick = async () => {
          const gen = ctx.data.getGenerator("randomUser");
          if (!gen) return alert("Generator not found");
          const out = await gen.generate();
          console.info("Generated user:", out);
          alert("Generated user (see console)");
        };
        root.appendChild(btn);
        mountPoint.appendChild(root);
        return () => mountPoint.removeChild(root);
      },
    });

    return { onUnmount: unregister };
  },
};

export default plugin;
