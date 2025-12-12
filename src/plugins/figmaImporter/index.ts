const manifest = { id: "figma-importer" } as const;

export default {
  manifest,
  async install(ctx: any) {
    const unregister = ctx.ui.registerPanel("figma-import-panel", {
      title: "Figma Import",
      panel: {
        position: "left",
        mount: (el: HTMLElement) => {
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.flexDirection = "column";
          container.style.gap = "8px";

          const info = document.createElement("div");
          info.textContent =
            "Import JSON exported by the OneFlow Figma plugin.";
          container.appendChild(info);

          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json";
          container.appendChild(input);

          const btn = document.createElement("button");
          btn.textContent = "Import";
          btn.onclick = () => {
            const f = (input as HTMLInputElement).files?.[0];
            if (!f) return alert("Choose a JSON file first");
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(String(reader.result || ""));
                if (!Array.isArray(parsed)) {
                  alert("File should contain an array of components");
                  return;
                }
                // Dispatch to app to set components
                ctx.app.dispatch({
                  type: "SET_COMPONENTS",
                  payload: { components: parsed },
                });
              } catch (e) {
                alert("Failed to parse JSON: " + String(e));
              }
            };
            reader.readAsText(f);
          };
          container.appendChild(btn);

          el.appendChild(container);

          return () => {
            try {
              el.removeChild(container);
            } catch {}
          };
        },
      },
    });

    return {
      onUnmount() {
        unregister();
      },
    };
  },
};
