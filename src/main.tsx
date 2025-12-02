import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./theme";
import { DataProvidersProvider } from "./contexts/DataProvidersContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvidersProvider>
        <App />
      </DataProvidersProvider>
    </ThemeProvider>
  </StrictMode>
);
