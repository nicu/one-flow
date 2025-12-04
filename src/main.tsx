import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./theme";
import { DataProvidersProvider } from "./contexts/DataProvidersContext";
import { PluginProvider } from "./plugins/PluginProvider";
import { initPluginSystem } from "./plugins/loader";

// Mount the app only after plugins have been initialized so plugin
// registered components (e.g. `image-grid`) are available during the
// initial render. This avoids a brief "Unknown Component" fallback
// while plugins load asynchronously.
async function boot() {
  try {
    await initPluginSystem();
  } catch (err) {
    // Non-fatal: continue to mount the app even if plugins fail to load
    // (console will contain the loader error).
    // eslint-disable-next-line no-console
    console.warn("Plugin system failed to initialize:", err);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <PluginProvider>
          <DataProvidersProvider>
            <App />
          </DataProvidersProvider>
        </PluginProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

boot();
