import { useDrop } from "react-dnd";
import type {
  BuilderComponent,
  ComponentType,
  DragItem,
} from "../types";
import { BuilderText } from "./builder/BuilderText";
import { BuilderImage } from "./builder/BuilderImage";
import { BuilderButton } from "./builder/BuilderButton";
import { BuilderInput } from "./builder/BuilderInput";
import { BuilderDropdown } from "./builder/BuilderDropdown";
import { buildStyle } from "./builder/utils";

interface RenderComponentProps {
  component: BuilderComponent;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onAddComponent: (type: ComponentType, parentId?: string) => void;
}

export const RenderComponent: React.FC<RenderComponentProps> = ({
  component,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onAddComponent,
}) => {
  const isLayout = ["flex", "grid", "row", "column"].includes(component.type);
  const isSelected = component.id === selectedId;
  const isHovered = component.id === hoveredId;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "COMPONENT",
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;
      if (isLayout && item.componentType) {
        console.log("RenderComponent drop target:", component.id, "isLayout", isLayout, "isOver", monitor.isOver({ shallow: true }));
        onAddComponent(item.componentType, component.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    canDrop: () => isLayout,
  }));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const handleMouseOver = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover(component.id);
  };

  const renderContent = () => {
    const props = component.properties;
    // We use the same buildStyle for layout containers
    const style = buildStyle(props, component.type);

    switch (component.type) {
      case "text":
        return <BuilderText properties={props} />;

      case "image":
        return <BuilderImage properties={props} />;

      case "button":
        return <BuilderButton properties={props} />;

      case "input":
        return <BuilderInput properties={props} />;

      case "dropdown":
        return <BuilderDropdown properties={props} />;

      case "flex":
      case "row":
      case "column":
      case "grid": {
        const children = component.children || [];
        return (
          <div style={style}>
            {children.length === 0 ? (
              <div className="drop-zone-empty">Drop components here</div>
            ) : (
              children.map((child) => (
                <RenderComponent
                  key={child.id}
                  component={child}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                />
              ))
            )}
          </div>
        );
      }

      default:
        return <div style={style}>Unknown Component</div>;
    }
  };

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={isLayout ? (drop as any) : null}
      className={`rendered-component ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""} ${
        isOver ? "drop-over" : ""
      }`}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
    >
      {isSelected && (
        <div className="component-label-tag">
          {component.type}
        </div>
      )}
      {renderContent()}
    </div>
  );
};
