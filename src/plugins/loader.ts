import { pluginRegistry } from "./registry";

export async function initPluginSystem() {
  // discover plugin entry points under src/plugins/*/index.ts or .tsx
  // Vite's import.meta.glob returns a map of import functions
  const modules = import.meta.glob("/src/plugins/*/index.{ts,tsx}");

  // Prefer .tsx entry when both .tsx and .ts exist for a plugin folder.
  const byDir = new Map<string, string>();
  for (const path in modules) {
    const m = path as string;
    // extract plugin dir name
    const parts = m.split("/");
    const dir = parts.length >= 4 ? parts[3] : parts[2] || m;
    const existing = byDir.get(dir);
    if (!existing) {
      byDir.set(dir, m);
      continue;
    }
    // prefer index.tsx over index.ts
    if (existing.endsWith(".ts") && m.endsWith(".tsx")) {
      byDir.set(dir, m);
    }
  }

  for (const [dir, path] of byDir.entries()) {
    try {
      const load = (modules as Record<string, any>)[path];
      if (!load) continue;
      const mod = await load();
      const pluginModule = mod?.default ?? mod;
      const manifest = pluginModule?.manifest ?? { id: dir };
      await pluginRegistry.loadPluginModule(manifest, mod);
    } catch (err) {
      console.warn("Failed to load plugin at", path, err);
    }
  }
}

// Export for convenience
export { pluginRegistry } from "./registry";
