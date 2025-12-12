# OneFlow Figma Exporter

Install as a development plugin in Figma (menu: Plugins → Development → Import plugin from manifest) using this folder.

Usage:

- Open a Figma file and select layers to export (or none to export the whole page).
- Run the plugin. Click "Export Selection as OneFlow JSON".
- Download the produced `oneflow-export.json` and import into the OneFlow app (via the app plugin).

Notes:

- Images are exported as embedded data URLs (PNG).
- The exporter targets the OneFlow JSON shape used in `src/examples/` (simple `id`, `type`, `properties`, `children`).
- Complex styles and interactions are not preserved in this prototype.
