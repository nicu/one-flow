import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { BuilderComponent } from "./types";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilder } from "./hooks/useBuilder";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import LTPropertiesPanel from "./components/LTPropertiesPanel";
import { ExportModal } from "./components/ExportModal";
import FeatureFlagsModal from "./components/FeatureFlagsModal";
import EntitiesTab from "./components/EntitiesTab";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
import { exportToReact, exportToJSON } from "./utils/export";
import aiToBuilder from "./utils/aiToBuilder";
import landingPage from "./examples/landingPage.json";
import airbnbPage from "./examples/airbnbPage.json";
import dataBindingPage from "./examples/dataBinding.json";
import datagridHotels from "./examples/datagridHotels.json";
import userForm from "./examples/userForm.json";
import { initialDataStore, type DataStore } from "./store/dataStore";
import "./App.css";
import "./i18n";
import LanguageSelector from "./components/LanguageSelector";
import { seedTranslationsFromComponents } from "./utils/i18nUtils";

function App() {
  const {
    components,
    selectedId,
    selectedIds,
    setSelectedIds,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponents,
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
  const [isFlagsModalOpen, setIsFlagsModalOpen] = useState(false);
  // used to force re-render when flags are updated
  const [flagsVersion, setFlagsVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<"ui" | "data" | "entities">("ui");
  const [dataStore, setDataStore] = useState<DataStore>(initialDataStore);

  const selectedComponent = getSelectedComponent();

  // Find the ancestor path for a component id, returning array of ancestor
  // components from root -> immediate parent. If not found, returns null.
  const findAncestorPath = (
    nodes: BuilderComponent[],
    targetId: string,
    path: BuilderComponent[] = []
  ): BuilderComponent[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) return path;
      if (node.children) {
        const res = findAncestorPath(node.children, targetId, [...path, node]);
        if (res) return res;
      }
    }
    return null;
  };

  // Bind the currently selected component to the nearest enclosing
  // `lt-data-provider` by setting the child's `properties.dataBinding.modelId`
  // to the provider's model id (if one exists). This is a convenience used
  // from the Properties panel.
  const bindSelectedToEnclosingProvider = () => {
    if (!selectedId) return window.alert("No component selected");
    const path = findAncestorPath(components, selectedId);
    if (!path) return window.alert("No enclosing provider found");

    // Find the nearest provider starting from the end of the path (closest parent)
    for (let i = path.length - 1; i >= 0; i--) {
      const ancestor = path[i];
      if (ancestor.type === "lt-data-provider") {
        const provId =
          (ancestor.properties as any)?.providerId ||
          (ancestor.properties as any)?.dataBinding?.modelId;
        if (!provId)
          return window.alert("Enclosing provider has no model selected");

        // Apply binding to selected component
        updateComponent(selectedId, {
          dataBinding: {
            ...(selectedComponent?.properties.dataBinding || {}),
            modelId: provId,
          },
        });
        return;
      }
    }

    return window.alert("No enclosing provider found");
  };

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
      // Note: Delete should remove the selected component generally,
      // but Backspace must behave normally when focus is inside an input/textarea/contentEditable.

      // Undo/redo (Cmd/Ctrl+Z) handled above; keep that behavior
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase() ?? "";
      const isEditableField = !!(
        target &&
        (target.isContentEditable ||
          tag === "input" ||
          tag === "textarea" ||
          tag === "select")
      );

      // If Backspace and focus is inside an editable field, let it behave normally
      if (e.key === "Backspace") {
        if (isEditableField) return;
      }

      // The Delete key (or Backspace when not focused on input) removes the selected component.
      if (e.key === "Delete" || e.key === "Backspace") {
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

  // After initial hydration, seed translations for any loaded components
  useEffect(() => {
    try {
      if (hydrated.current && components && components.length > 0) {
        seedTranslationsFromComponents(components, "en");
      }
    } catch (e) {
      // ignore
    }
  }, [components]);

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
    const onFlags = () => setFlagsVersion((v) => v + 1);
    window.addEventListener("of_flags_updated", onFlags as EventListener);
    return () =>
      window.removeEventListener("of_flags_updated", onFlags as EventListener);
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

  // Keep a `data-viewport` attribute on the root so CSS rules scoped by
  // `[data-viewport="..."] .elem-<id>` apply when the user toggles the
  // editor viewport. This attribute is lightweight and purely presentational
  // for CSS matching.
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-viewport", viewport);
    } catch (e) {
      // ignore in SSR / non-browser
    }
  }, [viewport]);

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
      <div className="app" data-flags-version={flagsVersion}>
        <header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <h1>OneFlow Builder</h1>
            <div className="viewport-controls">
              <button
                className={`viewport-btn ${activeTab === "ui" ? "active" : ""}`}
                onClick={() => setActiveTab("ui")}
              >
                UI
              </button>
              <button
                className={`viewport-btn ${
                  activeTab === "entities" ? "active" : ""
                }`}
                onClick={() => setActiveTab("entities")}
              >
                Data
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
                className="btn-outlined"
                onClick={() => setIsFlagsModalOpen(true)}
                title="Edit Feature Flags"
              >
                Feature Flags
              </button>

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
                      const parsed = JSON.parse(event.target?.result as string);

                      // Normalize common shapes produced by the assistant or saved
                      // export files. Accept:
                      // - an array of components
                      // - a single component object
                      // - an object like { ui: ... } produced by the assistant endpoint
                      // Use `aiToBuilder` to convert single-node responses into a
                      // BuilderComponent[] so the rest of the app can assume an array.
                      let toSet: BuilderComponent[] = [];
                      if (Array.isArray(parsed)) {
                        toSet = parsed as BuilderComponent[];
                      } else if (parsed && typeof parsed === "object") {
                        // assistant-wrapped response
                        if (parsed.ui) {
                          const u = parsed.ui;
                          if (Array.isArray(u)) toSet = u as BuilderComponent[];
                          else toSet = aiToBuilder(u);
                        } else if (
                          parsed.components &&
                          Array.isArray(parsed.components)
                        ) {
                          toSet = parsed.components as BuilderComponent[];
                        } else if (parsed.type) {
                          toSet = aiToBuilder(parsed);
                        } else {
                          // Fallback: attempt to convert whatever we received
                          toSet = aiToBuilder(parsed);
                        }
                      }

                      if (!Array.isArray(toSet)) {
                        console.error(
                          "Imported JSON could not be normalized to a component array",
                          parsed
                        );
                        return;
                      }

                      setComponents(toSet);
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

              <LanguageSelector />
            </div>
          </div>
        </header>

        <div className="app-content">
          {activeTab === "ui" && (
            <aside className="sidebar left">
              <ComponentLibrary
                components={components}
                selectedId={selectedId}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onSelect={selectComponent}
                onMoveComponents={moveComponents}
                onAddComponent={addComponent as any}
              />
            </aside>
          )}

          <main
            className="main-area"
            style={{
              backgroundColor: "#e5e5e5",
              padding: activeTab !== "ui" ? "0" : "40px",
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
                  selectedIds={selectedIds}
                  hoveredId={hoveredId}
                  onAddComponent={addComponent}
                  onSelectComponent={selectComponent}
                  onHoverComponent={setHoveredId}
                  onMoveComponents={moveComponents}
                  dataStore={dataStore}
                  setDataStore={setDataStore}
                />
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex" }}>
                <EntitiesTab
                  dataStore={dataStore}
                  setDataStore={setDataStore}
                />
              </div>
            )}
          </main>

          {activeTab === "ui" && (
            <aside className="sidebar right">
              {selectedComponent &&
              String(selectedComponent.type).startsWith("lt-") ? (
                <LTPropertiesPanel
                  component={selectedComponent}
                  onUpdate={(props) =>
                    selectedId && updateComponent(selectedId, props)
                  }
                  onDelete={() => selectedId && removeComponent(selectedId)}
                />
              ) : (
                <PropertiesPanel
                  component={selectedComponent}
                  onUpdate={(props) =>
                    selectedId && updateComponent(selectedId, props)
                  }
                  onDelete={() => selectedId && removeComponent(selectedId)}
                  dataStore={dataStore}
                  onGenerateForm={generateFormFromModel}
                  onBindToEnclosingProvider={bindSelectedToEnclosingProvider}
                />
              )}
            </aside>
          )}
        </div>

        <FeatureFlagsModal
          isOpen={isFlagsModalOpen}
          onClose={() => setIsFlagsModalOpen(false)}
        />

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
            // Debug: count nodes helper
            const countNodes = (
              items: BuilderComponent[] | undefined
            ): number => {
              if (!items || items.length === 0) return 0;
              let c = 0;
              for (const it of items) {
                c += 1;
                if (it.children) c += countNodes(it.children);
              }
              return c;
            };

            console.info(
              "[AI] inserting components: top-level count=",
              remapped.length,
              "total nodes(estimated)=",
              countNodes(remapped)
            );

            // Append AI-generated components to the selected layout, or to root if none selected
            setComponents((prev) => {
              const selected = getSelectedComponent();
              const isLayout = selected
                ? ["flex", "grid", "row", "column", "form"].includes(
                    selected.type as string
                  )
                : false;

              let next: BuilderComponent[];
              if (selected && isLayout) {
                // append as children of the selected component
                const appended = replaceChildren(prev, selected.id, [
                  ...(selected.children || []),
                  ...remapped,
                ]);
                next = appended;
              } else {
                // otherwise append at root
                next = [...prev, ...remapped];
              }

              // Log resulting counts for debugging
              try {
                const prevCount = countNodes(prev);
                const nextCount = countNodes(next);
                console.info(
                  "[AI] components before=",
                  prevCount,
                  "after=",
                  nextCount
                );
              } catch (e) {
                console.info("[AI] components inserted (counts unavailable)");
              }

              return next;
            });

            selectComponent(null);
          }}
        />
      </div>
    </DndProvider>
  );
}

export default App;
