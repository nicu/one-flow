import { pluginRegistry } from "./registry";

export async function initPluginSystem() {
  // discover plugin entry points under each subfolder of this folder
  // Use a relative glob so Vite reliably matches `src/plugins/*/index.ts(x)`
  // when compiled from the `src/plugins` directory.
  const modules = import.meta.glob("./*/index.{ts,tsx}");

  // Prefer .tsx entry when both .tsx and .ts exist for a plugin folder.
  const byDir = new Map<string, string>();
  for (const path in modules) {
    const m = path as string;
    // extract plugin dir name from patterns like './plugin-id/index.ts'
    const parts = m.split("/");
    const dir = parts[1] || parts[2] || m;
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
      const load = (modules as Record<string, () => Promise<unknown>>)[path];
      if (!load) continue;
      const mod = await load();
      const pluginModule = (mod as any)?.default ?? (mod as any);
      const manifest = (pluginModule?.manifest as any) ?? { id: dir };
      await pluginRegistry.loadPluginModule(manifest, mod);
    } catch (err) {
      console.warn("Failed to load plugin at", path, err);
    }
  }
}

// Export for convenience
export { pluginRegistry } from "./registry";
