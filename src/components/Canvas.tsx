import { useDrop } from "react-dnd";
import type { BuilderComponent, DragItem, AllComponentType } from "../types";
import type { DataStore } from "../store/dataStore";
import { RenderComponent } from "./RenderComponent";
import { DataContext } from "../contexts/DataContext";

interface CanvasProps {
  components: BuilderComponent[];
  selectedId: string | null;
  selectedIds?: string[];
  hoveredId: string | null;
  onAddComponent: (
    type: AllComponentType,
    parentId?: string | null,
    index?: number
  ) => void;
  onMoveComponents?: (
    ids: string[],
    parentId?: string | null,
    index?: number
  ) => void;

  onSelectComponent: (id: string | null) => void;
  onHoverComponent: (id: string | null) => void;
  dataStore?: DataStore;
  setDataStore?: (s: DataStore) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  components,
  selectedId,
  selectedIds,
  hoveredId,
  onAddComponent,
  onMoveComponents,
  onSelectComponent,
  onHoverComponent,
  dataStore,
  setDataStore,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["COMPONENT", "MOVE_COMPONENT"],
    drop: (item: DragItem, monitor) => {
      // Debug: log whether another nested target already handled the drop
      try {
         
        console.debug(
          "Canvas drop: didDrop=",
          typeof monitor.didDrop === "function"
            ? monitor.didDrop()
            : "no-monitor"
        );
      } catch (e) {
        // ignore
      }

      // If a nested drop target already handled this drop, don't add to root.
      if (monitor && monitor.didDrop && monitor.didDrop()) return;
      if (item.ids && item.ids.length > 0 && onMoveComponents) {
        onMoveComponents(item.ids, undefined);
        return;
      }
      if (item.componentType) {
         
        console.debug("Canvas: adding component to root:", item.componentType);
        onAddComponent(item.componentType);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const content = (
    <div className="canvas-container">
      <div
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={drop as any}
        className="canvas"
        style={{
          backgroundColor: isOver ? "#f0f8ff" : "#ffffff",
          minHeight: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectComponent(null);
          }
        }}
        onMouseOver={(e) => {
          if (e.target === e.currentTarget) {
            onHoverComponent(null);
          }
        }}
        onMouseLeave={() => {
          onHoverComponent(null);
        }}
      >
        {components.length === 0 ? (
          <div className="canvas-empty">
            Drop components here to start building
          </div>
        ) : (
          components.map((component) => (
            <RenderComponent
              key={component.id}
              component={component}
              selectedId={selectedId}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              onSelect={onSelectComponent}
              onHover={onHoverComponent}
              onAddComponent={onAddComponent}
              onMoveComponents={onMoveComponents}
            />
          ))
        )}
      </div>
    </div>
  );

  // Wrap with DataContext if dataStore is provided
  if (dataStore) {
    return (
      <DataContext.Provider value={{ dataStore, setDataStore }}>
        {content}
      </DataContext.Provider>
    );
  }

  return content;
};

export default Canvas;
