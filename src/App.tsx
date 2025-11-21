import { useState, useEffect, useRef } from "react";
import type { BuilderComponent } from "./types";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilder } from "./hooks/useBuilder";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ExportModal } from "./components/ExportModal";
import { exportToReact, exportToJSON } from "./utils/export";
import examplePage from "./examples/complexPage.json";
import airbnbPage from "./examples/airbnbPage.json";
import "./App.css";

function App() {
  const {
    components,
    selectedId,
    addComponent,
    updateComponent,
    removeComponent,
    selectComponent,
    getSelectedComponent,
    setComponents,
    undo,
    redo,
    canUndo,
    canRedo,
    hoveredId,
    setHoveredId,
  } = useBuilder();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const selectedComponent = getSelectedComponent();

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleLoadExample = () => {
    // load the example page into the builder
    setComponents(examplePage as unknown as BuilderComponent[]);
    selectComponent(null);
  };

  const handleLoadAirbnb = () => {
    setComponents(airbnbPage as unknown as BuilderComponent[]);
    selectComponent(null);
  };

  // keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const handleReset = () => {
    setComponents([]);
    selectComponent(null);
  };

  // Persisted state: hydrate from localStorage on mount, then persist on changes.
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("oneflow:components");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setComponents(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      hydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // don't persist until we've attempted the initial hydration
    if (!hydrated.current) return;
    try {
      localStorage.setItem("oneflow:components", JSON.stringify(components));
    } catch {
      // ignore
    }
  }, [components]);

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      case "desktop": return "100%";
      default: return "100%";
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <h1>OneFlow Builder</h1>
            <div className="viewport-controls">
              <button 
                className={`viewport-btn ${viewport === "desktop" ? "active" : ""}`}
                onClick={() => setViewport("desktop")}
              >
                🖥 Desktop
              </button>
              <button 
                className={`viewport-btn ${viewport === "tablet" ? "active" : ""}`}
                onClick={() => setViewport("tablet")}
              >
                📱 Tablet
              </button>
              <button 
                className={`viewport-btn ${viewport === "mobile" ? "active" : ""}`}
                onClick={() => setViewport("mobile")}
              >
                📱 Mobile
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="export-button" onClick={handleExport}>
              Export
            </button>
            <button
              className="export-button"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button
              className="export-button"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </button>
            <button className="export-button" onClick={handleLoadExample}>
              Load Example
            </button>
            <button className="export-button" onClick={handleLoadAirbnb}>
              Load Airbnb
            </button>
            <button className="export-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </header>

        <div className="app-content">
          <aside className="sidebar left">
            <ComponentLibrary />
          </aside>

          <main className="main-area" style={{ backgroundColor: "#e5e5e5", padding: "40px", display: "flex", justifyContent: "center", overflow: "auto" }}>
            <div style={{ 
              width: getViewportWidth(), 
              minHeight: "100%",
              backgroundColor: "white", 
              boxShadow: "0 0 20px rgba(0,0,0,0.1)",
              transition: "width 0.3s ease",
              overflow: "visible", // Allow content to expand the box
              display: "flex",
              flexDirection: "column"
            }}>
              <Canvas
                components={components}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onAddComponent={addComponent}
                onSelectComponent={selectComponent}
                onHoverComponent={setHoveredId}
              />
            </div>
          </main>

          <aside className="sidebar right">
            <PropertiesPanel
              component={selectedComponent}
              onUpdate={(props) =>
                selectedId && updateComponent(selectedId, props)
              }
              onDelete={() => selectedId && removeComponent(selectedId)}
            />
          </aside>
        </div>

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reactCode={exportToReact(components)}
          jsonCode={exportToJSON(components)}
        />
      </div>
    </DndProvider>
  );
}

export default App;
