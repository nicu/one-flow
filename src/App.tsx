import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilder } from "./hooks/useBuilder";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ExportModal } from "./components/ExportModal";
import { exportToReact, exportToJSON } from "./utils/export";
import examplePage from "./examples/complexPage.json";
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
  } = useBuilder();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const selectedComponent = getSelectedComponent();

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleLoadExample = () => {
    // load the example page into the builder
    setComponents(examplePage as any);
    selectComponent(null);
  };

  const handleReset = () => {
    setComponents([]);
    selectComponent(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>OneFlow Builder</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="export-button" onClick={handleExport}>
              Export
            </button>
            <button className="export-button" onClick={handleLoadExample}>
              Load Example
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

          <main className="main-area">
            <Canvas
              components={components}
              selectedId={selectedId}
              onAddComponent={addComponent}
              onSelectComponent={selectComponent}
            />
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
