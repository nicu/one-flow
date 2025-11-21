import { useState, useEffect, useRef } from "react";
import type { BuilderComponent } from "./types";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilder } from "./hooks/useBuilder";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ExportModal } from "./components/ExportModal";
import { DataPanel } from "./components/DataPanel";
import { exportToReact, exportToJSON } from "./utils/export";
import landingPage from "./examples/landingPage.json";
import airbnbPage from "./examples/airbnbPage.json";
import dataBindingPage from "./examples/dataBinding.json";
import datagridHotels from "./examples/datagridHotels.json";
import userForm from "./examples/userForm.json";
import { initialDataStore, type DataStore } from "./store/dataStore";
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
  const [activeTab, setActiveTab] = useState<"ui" | "data">("ui");
  const [dataStore, setDataStore] = useState<DataStore>(initialDataStore);

  const selectedComponent = getSelectedComponent();

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const examples: Record<string, BuilderComponent[]> = {
    "Landing page": landingPage as unknown as BuilderComponent[],
    Airbnb: airbnbPage as unknown as BuilderComponent[],
    "Data binding": dataBindingPage as unknown as BuilderComponent[],
    "DataGrid (Hotels)": datagridHotels as unknown as BuilderComponent[],
    "User Form": userForm as unknown as BuilderComponent[],
  };

  const [selectedExample, setSelectedExample] =
    useState<string>("Landing page");

  const handleLoadSelected = () => {
    const selection = examples[selectedExample];
    if (selection) {
      setComponents(selection as BuilderComponent[]);
      selectComponent(null);
    }
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

  // Persist data store to localStorage
  const dataHydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("oneflow:dataStore");
      if (raw) {
        const parsed = JSON.parse(raw);
        setDataStore(parsed);
      }
    } catch {
      // ignore
    } finally {
      dataHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!dataHydrated.current) return;
    try {
      localStorage.setItem("oneflow:dataStore", JSON.stringify(dataStore));
    } catch {
      // ignore
    }
  }, [dataStore]);

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
        return "100%";
      default:
        return "100%";
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
                className={`viewport-btn ${activeTab === "ui" ? "active" : ""}`}
                onClick={() => setActiveTab("ui")}
              >
                🎨 UI
              </button>
              <button
                className={`viewport-btn ${
                  activeTab === "data" ? "active" : ""
                }`}
                onClick={() => setActiveTab("data")}
              >
                🗄️ Data
              </button>
            </div>
            {activeTab === "ui" && (
              <div className="viewport-controls">
                <button
                  className={`viewport-btn ${
                    viewport === "desktop" ? "active" : ""
                  }`}
                  onClick={() => setViewport("desktop")}
                >
                  🖥 Desktop
                </button>
                <button
                  className={`viewport-btn ${
                    viewport === "tablet" ? "active" : ""
                  }`}
                  onClick={() => setViewport("tablet")}
                >
                  📱 Tablet
                </button>
                <button
                  className={`viewport-btn ${
                    viewport === "mobile" ? "active" : ""
                  }`}
                  onClick={() => setViewport("mobile")}
                >
                  📱 Mobile
                </button>
              </div>
            )}
          </div>
          <div className="header-actions">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="export-button" onClick={handleExport}>
                Export
              </button>
              <button
                className="btn-ghost"
                onClick={undo}
                disabled={!canUndo}
                title="Undo"
              >
                Undo
              </button>
              <button
                className="btn-ghost"
                onClick={redo}
                disabled={!canRedo}
                title="Redo"
              >
                Redo
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                className="example-select"
                value={selectedExample}
                onChange={(e) => setSelectedExample(e.target.value)}
              >
                {Object.keys(examples).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleLoadSelected}>
                Load
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn-ghost"
                onClick={() =>
                  document.getElementById("import-file-input")?.click()
                }
              >
                Import
              </button>
              <input
                id="import-file-input"
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const json = JSON.parse(event.target?.result as string);
                      setComponents(json as unknown as BuilderComponent[]);
                      selectComponent(null);
                    } catch (err) {
                      console.error("Failed to import JSON", err);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <button className="btn-ghost" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </header>

        <div className="app-content">
          {activeTab === "ui" && (
            <aside className="sidebar left">
              <ComponentLibrary />
            </aside>
          )}

          <main
            className="main-area"
            style={{
              backgroundColor: "#e5e5e5",
              padding: activeTab === "data" ? "0" : "40px",
              display: "flex",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            {activeTab === "ui" ? (
              <div
                style={{
                  width: getViewportWidth(),
                  minHeight: "100%",
                  backgroundColor: "white",
                  boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                  transition: "width 0.3s ease",
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Canvas
                  components={components}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onAddComponent={addComponent}
                  onSelectComponent={selectComponent}
                  onHoverComponent={setHoveredId}
                  dataStore={dataStore}
                  setDataStore={setDataStore}
                />
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%" }}>
                <DataPanel
                  models={dataStore.models}
                  relationships={dataStore.relationships}
                />
              </div>
            )}
          </main>

          {activeTab === "ui" && (
            <aside className="sidebar right">
              <PropertiesPanel
                component={selectedComponent}
                onUpdate={(props) =>
                  selectedId && updateComponent(selectedId, props)
                }
                onDelete={() => selectedId && removeComponent(selectedId)}
                dataStore={dataStore}
              />
            </aside>
          )}
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
