import { useDrop } from "react-dnd";
import type { BuilderComponent, DragItem, ComponentType } from "../types";
import { RenderComponent } from "./RenderComponent";

interface CanvasProps {
  components: BuilderComponent[];
  selectedId: string | null;
  hoveredId: string | null;
  onAddComponent: (type: ComponentType, parentId?: string) => void;
  onSelectComponent: (id: string | null) => void;
  onHoverComponent: (id: string | null) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  components,
  selectedId,
  hoveredId,
  onAddComponent,
  onSelectComponent,
  onHoverComponent,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "COMPONENT",
    drop: (item: DragItem) => {
      if (item.componentType) {
        onAddComponent(item.componentType);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        <h3>Canvas</h3>
      </div>
      <div
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={drop as any}
        className="canvas"
        style={{
          backgroundColor: isOver ? "#f0f8ff" : "#ffffff",
          minHeight: "100%",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectComponent(null);
          }
        }}
        onMouseOver={(e) => {
          // If we hover over the canvas background (not a component), clear hover
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
              hoveredId={hoveredId}
              onSelect={onSelectComponent}
              onHover={onHoverComponent}
              onAddComponent={onAddComponent}
            />
          ))
        )}
      </div>
    </div>
  );
};
