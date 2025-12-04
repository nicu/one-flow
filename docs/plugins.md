# Plugins

This document describes the plugin system for OneFlow. It explains the plugin contract, extension points, loading, and security recommendations.

Quick summary

- Plugins are TypeScript modules placed under `src/plugins/<plugin-id>/index.ts`.
- Each plugin exports a default object that implements an `install(ctx)` function and a `manifest`.
- The app discovers plugins using Vite's `import.meta.glob` and calls `install` with a small, safe `PluginContext`.

Plugin layout (recommended)

```
src/plugins/
  example-ui/
    index.ts         # plugin entry (exports default plugin)
    manifest.json    # optional manifest file
```

Plugin manifest

- `id`: unique string id (e.g. `com.acme.example`)
- `name`, `version`, `description`, `author`
- `main`: entry module path (optional if using `index.ts`)
- `permissions`: optional capability list that documents requested APIs

Plugin contract

- Export a default object with `manifest` and `install(ctx)`.
- `install` receives a `PluginContext` with limited APIs to register UI panels, components, data generators, bindings, and to log or listen to events.
- `install` may return lifecycle handlers: `{ onUnmount?: ()=>void }`.

Extension points

- UI panels: add side panels and menu items.
- Components: register new renderable component types and editors.
- Data generators: provide named data generators for examples and mock data.
- Binding providers: add custom expression evaluators or data binding backends.

Security

- Only load trusted plugins in-process. For untrusted plugins, isolate UI in an `iframe` or a Worker, and proxy a very small API surface.
- Do not permit arbitrary `eval` — use expression parsers or sandboxed evaluators for bindings.
- Validate plugin manifests and prefer signed/distributed plugins for production.

Developer guidance

- Prefer TypeScript and export small, well-documented APIs.
- Provide `onUnmount` clean-up for any DOM or subscriptions created.
- When possible, only use `ctx` APIs rather than reaching into global app state.

HMR and development

- During development the loader supports hot-reloading plugin modules. Plugins should be resilient to repeated `install`/`unmount` cycles.

Examples

- See `src/plugins/example-ui` for a minimal UI plugin.

Further work

- Add a `PluginProvider` React context to expose the registry to components.
- Add permission checks and optional sandboxing adapter.
