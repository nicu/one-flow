import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { BuilderComponent } from "./types";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilder } from "./hooks/useBuilder";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ExportModal } from "./components/ExportModal";
import { DataPanel } from "./components/DataPanel";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
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

  // Helper to replace the children of a specific component by id
  const replaceChildren = (
    componentsArr: BuilderComponent[],
    parentId: string,
    newChildren: BuilderComponent[]
  ): BuilderComponent[] => {
    return componentsArr.map((c) => {
      if (c.id === parentId) {
        return { ...c, children: newChildren };
      }
      if (c.children) {
        return {
          ...c,
          children: replaceChildren(c.children, parentId, newChildren),
        };
      }
      return c;
    });
  };

  const generateFormFromModel = (modelId: string) => {
    const model = dataStore.models.find((m) => m.id === modelId);
    if (!model || !selectedId) return;

    const newChildren: BuilderComponent[] = model.fields
      .filter(
        (f) =>
          f.type === "string" || f.type === "number" || f.type === "boolean"
      )
      .map((f) => {
        if (f.type === "boolean") {
          return {
            id: uuidv4(),
            type: "dropdown",
            properties: {
              label: f.name,
              options: ["true", "false"],
              dataBinding: { modelId: modelId, fieldId: f.id },
            },
          } as BuilderComponent;
        }

        // string or number -> input
        return {
          id: uuidv4(),
          type: "input",
          properties: {
            label: f.name,
            inputType: f.type === "number" ? "number" : "text",
            placeholder: f.name,
            dataBinding: { modelId: modelId, fieldId: f.id },
          },
        } as BuilderComponent;
      });

    setComponents((prev) => {
      // Update the selected form's dataBinding.modelId so the form reads from the correct model
      const withProps = updateComponentPropertiesById(prev, selectedId, {
        dataBinding: {
          ...(getSelectedComponent()?.properties.dataBinding || {}),
          modelId,
        },
      });
      return replaceChildren(withProps, selectedId, newChildren);
    });
  };

  const updateComponentPropertiesById = (
    componentsArr: BuilderComponent[],
    id: string,
    nextProps: Partial<Record<string, unknown>>
  ): BuilderComponent[] => {
    return componentsArr.map((c) => {
      if (c.id === id) {
        return { ...c, properties: { ...(c.properties || {}), ...nextProps } };
      }
      if (c.children) {
        return {
          ...c,
          children: updateComponentPropertiesById(c.children, id, nextProps),
        };
      }
      return c;
    });
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
    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener("keydown", handler, opts);
    return () => window.removeEventListener("keydown", handler, opts);
  }, [undo, redo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Note: Delete should remove the selected component even when inputs are focused

      // Undo/redo (Cmd/Ctrl+Z) handled above; keep that behavior
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod) return;

      // Only the Delete key removes the selected component. Do not remove on Backspace.
      if (e.key === "Delete") {
        if (selectedId) {
          e.preventDefault();
          removeComponent(selectedId);
        }
      }
    };
    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener("keydown", handler, opts);
    return () => window.removeEventListener("keydown", handler, opts);
  }, [removeComponent, selectedId]);

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
                onGenerateForm={generateFormFromModel}
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

        {/* AI Assistant floating panel */}
        <AIAssistantPanel
          context={
            selectedComponent
              ? `Selected: ${
                  selectedComponent.type
                } with props: ${JSON.stringify(selectedComponent.properties)}`
              : undefined
          }
          onInsertUI={(newComponents) => {
            // Assign fresh unique IDs to the inserted components to avoid
            // key collisions with existing components, then append.
            const remapIds = (
              items: BuilderComponent[]
            ): BuilderComponent[] => {
              return items.map((item) => {
                const newItem = JSON.parse(
                  JSON.stringify(item)
                ) as BuilderComponent;

                const remapRecursive = (node: BuilderComponent) => {
                  const newId = uuidv4();
                  node.id = newId;
                  if (Array.isArray(node.children)) {
                    node.children.forEach((c) => remapRecursive(c));
                  }
                };

                remapRecursive(newItem);
                return newItem;
              });
            };

            const remapped = remapIds(newComponents as BuilderComponent[]);

            // Append AI-generated components to the selected layout, or to root if none selected
            setComponents((prev) => {
              const selected = getSelectedComponent();
              const isLayout = selected
                ? ["flex", "grid", "row", "column", "form"].includes(
                    selected.type as string
                  )
                : false;

              if (selected && isLayout) {
                // append as children of the selected component
                const appended = replaceChildren(prev, selected.id, [
                  ...(selected.children || []),
                  ...remapped,
                ]);
                return appended;
              }

              // otherwise append at root
              return [...prev, ...remapped];
            });

            selectComponent(null);
          }}
        />
      </div>
    </DndProvider>
  );
}

export default App;
