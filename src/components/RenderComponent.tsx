import { useDrop } from "react-dnd";
import type { BuilderComponent, ComponentType, DragItem } from "../types";
import { BuilderText } from "./builder/BuilderText";
import { BuilderImage } from "./builder/BuilderImage";
import { BuilderButton } from "./builder/BuilderButton";
import { BuilderInput } from "./builder/BuilderInput";
import { BuilderDropdown } from "./builder/BuilderDropdown";
import BuilderDataGrid from "./builder/BuilderDataGrid";
import { buildStyle } from "./builder/utils";
import { useDataContext, DataContext } from "../contexts/DataContext";

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
  const dataContext = useDataContext();
  const isLayout = ["flex", "grid", "row", "column"].includes(component.type);
  const isSelected = component.id === selectedId;
  const isHovered = component.id === hoveredId;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "COMPONENT",
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;
      if (isLayout && item.componentType) {
        console.log(
          "RenderComponent drop target:",
          component.id,
          "isLayout",
          isLayout,
          "isOver",
          monitor.isOver({ shallow: true })
        );
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

  // Helper to get bound data value
  const getBoundValue = (fieldId?: string) => {
    if (!dataContext || !fieldId) return null;
    const { currentItem, currentModelId, dataStore } = dataContext;

    // If we're inside a list, use the current item
    if (currentItem && currentModelId) {
      return currentItem[fieldId];
    }

    // Otherwise, try to get from global data (first item)
    const binding = component.properties.dataBinding;
    if (binding?.modelId) {
      const data = dataStore.data[binding.modelId];
      if (data && data.length > 0) {
        return data[0][fieldId];
      }
    }

    return null;
  };

  const renderContent = () => {
    const props = component.properties;
    const binding = props.dataBinding;
    const style = buildStyle(props, component.type);

    // Handle data binding for simple components
    let boundProps = { ...props };
    if (binding?.fieldId && dataContext) {
      const value = getBoundValue(binding.fieldId);
      if (value !== null) {
        // Map field value to component property
        switch (component.type) {
          case "text":
            boundProps.text = String(value);
            break;
          case "image":
            boundProps.src = String(value);
            break;
          case "button":
            boundProps.buttonText = String(value);
            break;
          case "input":
            boundProps.placeholder = String(value);
            break;
        }
      }
    }

    switch (component.type) {
      case "text":
        return <BuilderText properties={boundProps} />;

      case "image":
        return <BuilderImage properties={boundProps} />;

      case "button":
        return <BuilderButton properties={boundProps} />;

      case "input":
        return <BuilderInput properties={boundProps} />;

      case "dropdown":
        return <BuilderDropdown properties={boundProps} />;

      case "datagrid": {
        // Determine rows from collection binding or explicit data
        const binding = component.properties.dataBinding;
        let rows: any[] = [];
        if (binding?.collectionId && dataContext) {
          rows = dataContext.dataStore.data[binding.collectionId] || [];
        }

        return (
          <BuilderDataGrid properties={component.properties} rows={rows} />
        );
      }

      case "flex":
      case "row":
      case "column":
      case "grid": {
        const children = component.children || [];

        // Handle list rendering if bound to a collection
        if (binding?.collectionId && dataContext) {
          const data = dataContext.dataStore.data[binding.collectionId];
          if (data && data.length > 0) {
            // Render children for each item in the collection
            return (
              <div style={style}>
                {data.map((item: any, index: number) => (
                  <div
                    key={`${component.id}-item-${index}`}
                    style={{ display: "contents" }}
                  >
                    <DataContext.Provider
                      value={{
                        dataStore: dataContext.dataStore,
                        currentItem: item,
                        currentModelId: binding.collectionId,
                      }}
                    >
                      {children.map((child) => (
                        <RenderComponent
                          key={`${child.id}-${index}`}
                          component={child}
                          selectedId={selectedId}
                          hoveredId={hoveredId}
                          onSelect={onSelect}
                          onHover={onHover}
                          onAddComponent={onAddComponent}
                        />
                      ))}
                    </DataContext.Provider>
                  </div>
                ))}
              </div>
            );
          }
        }

        // Normal rendering (no data binding)
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
      className={`rendered-component ${isSelected ? "selected" : ""} ${
        isHovered ? "hovered" : ""
      } ${isOver ? "drop-over" : ""}`}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
    >
      {isSelected && (
        <div className="component-label-tag">{component.type}</div>
      )}
      {renderContent()}
    </div>
  );
};
