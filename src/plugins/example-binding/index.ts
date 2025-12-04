import type { Plugin } from "../types";

// Simple, safe-ish binding provider for demo purposes.
// Supports expressions like:
// - `path:users.0.name` -> resolves from context object
// - `const:123` -> literal
// - `const:hello` -> string

function resolvePath(obj: any, path: string) {
  if (!obj) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (p === "") continue;
    if (/^\d+$/.test(p)) {
      cur = cur[Number(p)];
    } else {
      cur = cur[p];
    }
  }
  return cur;
}

const plugin: Plugin = {
  manifest: {
    id: "example.binding",
    name: "Example Binding Provider",
    version: "0.0.1",
    description:
      "Registers a tiny binding provider that handles `path:` and `const:` prefixes",
  },
  install(ctx) {
    ctx.bindings.registerBindingProvider("simple", {
      canHandle(expr: string) {
        return expr.startsWith("path:") || expr.startsWith("const:");
      },
      evaluate(expr: string, context: any) {
        try {
          if (expr.startsWith("path:")) {
            const path = expr.replace(/^path:/, "");
            return resolvePath(context, path);
          }
          if (expr.startsWith("const:")) {
            const val = expr.replace(/^const:/, "");
            // try number
            if (!isNaN(Number(val))) return Number(val);
            return val;
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    });

    const unregister = ctx.ui.registerPanel("example.binding.panel", {
      title: "Bindings",
      position: "right",
      mount(mountPoint) {
        const root = document.createElement("div");
        root.style.padding = "8px";
        const header = document.createElement("div");
        header.style.fontFamily =
          "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
        const strong = document.createElement("strong");
        strong.textContent = "Binding Provider";
        const p = document.createElement("p");
        p.style.margin = "6px 0 0 0";
        p.textContent = "Registers simple path: and const: binding handlers.";
        header.appendChild(strong);
        header.appendChild(p);
        root.appendChild(header);
        mountPoint.appendChild(root);
        return () => mountPoint.removeChild(root);
      },
    });

    return { onUnmount: unregister };
  },
};

export default plugin;
