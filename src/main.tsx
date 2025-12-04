import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./theme";
import { DataProvidersProvider } from "./contexts/DataProvidersContext";
import { PluginProvider } from "./plugins/PluginProvider";
import { initPluginSystem } from "./plugins/loader";

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

// Initialize plugin system (loads plugins from `src/plugins/*`)
// Non-blocking: plugins can mount after app boot.
initPluginSystem();
