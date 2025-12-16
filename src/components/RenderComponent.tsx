import React from "react";
import { useDrop, useDrag } from "react-dnd";
import type { BuilderComponent, AllComponentType, DragItem } from "../types";
import { BuilderText } from "./builder/BuilderText";
import { BuilderImage } from "./builder/BuilderImage";
import { BuilderButton } from "./builder/BuilderButton";
import { BuilderInput } from "./builder/BuilderInput";
import { BuilderDropdown } from "./builder/BuilderDropdown";
import BuilderDataGrid from "./builder/BuilderDataGrid";
import BuilderBreadcrumbs from "./builder/BuilderBreadcrumbs";
import BuilderTabs from "./builder/BuilderTabs";
import BuilderChip from "./builder/BuilderChip";
import BuilderForm from "./builder/BuilderForm";
import { buildStyle } from "./builder/utils";
import { ensureElementStyles } from "../utils/dynamicStyles";
import { evaluateExpressionFromPayload } from "../utils/evaluator";
import { useDataContext, DataContext } from "../contexts/DataContext";
import LTBox from "./builder/LTBox";
import LTTypography from "./builder/LTTypography";
import LTButton from "./builder/LTButton";
import LTInput from "./builder/LTInput";
import LTCard from "./builder/LTCard";
import LTImage from "./builder/LTImage";
import LTDataProvider from "./builder/LTDataProvider";
import BuilderBox from "./builder/BuilderBox";
import { componentRegistry } from "../plugins/registry";

interface RenderComponentProps {
  component: BuilderComponent;
  selectedId: string | null;
  selectedIds?: string[];
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
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
}

export const RenderComponent: React.FC<RenderComponentProps> = ({
  component,
  selectedId,
  selectedIds,
  hoveredId,
  onSelect,
  onHover,
  onAddComponent,
  onMoveComponents,
}) => {
  const dataContext = useDataContext();
  const isLayout = [
    "flex",
    "grid",
    "row",
    "column",
    "form",
    // treat LT containers as layout-capable so drag & drop works
    "lt-box",
    "box",
    "lt-card",
    "lt-nav",
    "lt-list",
    "lt-data-provider",
  ].includes(component.type as string);
  const isSelected = component.id === selectedId;
  const isHovered = component.id === hoveredId;

  // Drag from canvas: include all selectedIds if this node is part of selection
  const dragIds =
    selectedIds && selectedIds.includes(component.id)
      ? selectedIds
      : [component.id];

  const [, drag] = useDrag(
    () => ({
      type: "MOVE_COMPONENT",
      item: { ids: dragIds },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [dragIds]
  );

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["COMPONENT", "MOVE_COMPONENT"],
    drop: (item: DragItem, monitor) => {
      // Debug: log didDrop status for tracing duplicate adds
      try {
        console.debug(
          "RenderComponent drop: id=",
          component.id,
          "didDrop=",
          typeof monitor.didDrop === "function"
            ? monitor.didDrop()
            : "no-monitor",
          "isOver(shallow)=",
          monitor.isOver ? monitor.isOver({ shallow: true }) : "no-monitor"
        );
      } catch (e) {
        // ignore
      }

      if (monitor.didDrop()) return;
      // moving existing components
      if (item.ids && item.ids.length > 0 && onMoveComponents) {
        onMoveComponents(item.ids, component.id);
        return { moved: true };
      }
      // adding new component from palette
      if (isLayout && item.componentType) {
        console.debug(
          "RenderComponent: adding to layout",
          component.id,
          item.componentType
        );
        const addedId = onAddComponent(item.componentType, component.id);
        return { addedId };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    canDrop: () => isLayout,
  }));

  // Drop slot rendered between children to support inserting at a specific index.
  // When `isEmpty` is true, render a larger area (replacing the separate
  // `.drop-zone-empty` element) so the layout shows a single drop target.
  const DropSlot: React.FC<{
    parentId: string;
    index: number;
    parentType?: string;
    isEmpty?: boolean;
  }> = ({ parentId, index, parentType, isEmpty = false }) => {
    const [{ isOver: slotOver }, slotRef] = useDrop(() => ({
      accept: ["COMPONENT", "MOVE_COMPONENT"],
      drop: (item: DragItem, monitor) => {
        try {
          console.debug(
            "DropSlot drop:",
            "parent=",
            parentId,
            "index=",
            index,
            "didDrop=",
            typeof monitor.didDrop === "function"
              ? monitor.didDrop()
              : "no-monitor"
          );
        } catch (e) {
          // ignore
        }

        if (monitor.didDrop()) return;
        if (item.ids && item.ids.length > 0 && onMoveComponents) {
          onMoveComponents(item.ids, parentId, index);
          return { moved: true };
        }
        if (item.componentType) {
          console.debug(
            "DropSlot: adding to parent",
            parentId,
            "index",
            index,
            item.componentType
          );
          const addedId = onAddComponent(item.componentType, parentId, index);
          return { addedId };
        }
      },
      collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
      canDrop: () => isLayout,
    }));

    if (isEmpty) {
      return (
        <div
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={slotRef as any}
          className="drop-zone-empty"
          style={{
            backgroundColor: slotOver ? "rgba(37,99,235,0.03)" : undefined,
          }}
        >
          Drop components here
        </div>
      );
    }

    // Inline slots should be visually minimal so they don't create large
    // gaps between items (especially in column/flex layouts). Use a
    // smaller height and zero margin by default; highlight slightly on
    // hover so users can still discover drop targets.
    const isFlexLike =
      parentType === "flex" || parentType === "row" || parentType === "column";
    const slotStyle: React.CSSProperties = {
      height: isFlexLike ? 6 : 10,
      margin: isFlexLike ? 0 : 6,
      borderRadius: 4,
      transition: "background-color 120ms, height 120ms",
      backgroundColor: slotOver ? "rgba(37,99,235,0.12)" : "transparent",
    };

    return <div ref={slotRef as any} style={slotStyle} />;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const handleMouseOver = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover(component.id);
  };

  // Helper to get bound data value. Accepts a binding object and a fieldId.
  const getBoundValue = (binding?: any, fieldId?: string) => {
    if (!dataContext || !fieldId || !binding) return null;
    const { currentItem, currentModelId, dataStore } = dataContext;

    // Helper to resolve nested paths like 'name.first'
    const resolvePath = (obj: any, path: string) => {
      const parts = path.split(".");
      let cur = obj;
      for (const p of parts) {
        if (cur == null) return null;
        cur = cur[p];
      }
      return cur;
    };

    // If a current item is present (e.g. inside a list rendering), use it
    if (currentItem && currentModelId) {
      return resolvePath(currentItem, fieldId);
    }

    // Otherwise resolve from the bound model using optional itemIndex or itemId
    if (binding?.modelId && dataStore) {
      const arr = dataStore.data[binding.modelId] || [];
      let item: any = null;
      if (typeof binding.itemIndex === "number") {
        item = arr[Math.max(0, Math.min(binding.itemIndex, arr.length - 1))];
      } else if (binding.itemId) {
        item = arr.find(
          (it: any) =>
            it && (it.id === binding.itemId || it._id === binding.itemId)
        );
      } else if (arr.length > 0) {
        item = arr[0];
      }

      if (item) return resolvePath(item, fieldId);
    }

    return null;
  };

  const renderContent = () => {
    const props = component.properties || ({} as any);
    // Visibility default: true. If explicitly false, do not render the
    // component (initial simple behavior; selection/editing via tree
    // remains possible).
    // Evaluate visibilityExpression if present; otherwise fall back to static boolean
    let isVisible = props.visible !== false;
    if (props.visibilityExpression) {
      try {
        const raw = localStorage.getItem("of_flags");
        const flags = raw ? JSON.parse(raw) : {};
        const evaluated = evaluateExpressionFromPayload(
          props.visibilityExpression,
          flags,
          isSelected // enable debug logging when this component is selected
        );
        isVisible = Boolean(evaluated);
      } catch (e) {
        // if evaluation fails, keep default visibility
      }
    }
    if (!isVisible) return null;
    const binding = props.dataBinding;
    const style = buildStyle(props as any, component.type);
    // Ensure per-element CSS rules are generated so we can target them
    // with viewport-scoped selectors (e.g. `[data-viewport="tablet"]`).
    try {
      ensureElementStyles(component.id, props || {});
    } catch (e) {
      // ignore
    }

    // Handle data binding for simple components
    const boundProps = { ...props };
    if (binding?.fieldId && dataContext) {
      const value = getBoundValue(binding, binding.fieldId);
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

    // Check whether a plugin registered a component descriptor for this type.
    const pluginComp = componentRegistry.getComponent(component.type as string);
    if (pluginComp && pluginComp.renderPreview) {
      try {
        return <>{pluginComp.renderPreview(boundProps)}</>;
      } catch (e) {
        // Surface a helpful placeholder in the canvas so the user can see
        // that the plugin's preview rendering failed (console will contain
        // the stack trace). This avoids silently falling through to the
        // generic "Unknown Component" message and helps debugging.
        console.error("Plugin component render error", e);
        return (
          <div style={style}>
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                background: "#fee2e2",
                color: "#7f1d1d",
              }}
            >
              <strong>Plugin render error</strong>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Component: <code>{String(component.type)}</code>
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Check the console for details.
              </div>
            </div>
          </div>
        );
      }
    }

    switch (component.type) {
      case "box":
        return (
          <BuilderBox
            properties={component.properties}
            componentId={component.id}
          >
            {component.children &&
              component.children.map((c) => (
                <RenderComponent
                  key={c.id}
                  component={c}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                  onMoveComponents={onMoveComponents}
                />
              ))}
          </BuilderBox>
        );

      case "lt-box":
        return (
          <LTBox properties={component.properties}>
            {component.children &&
              component.children.map((c) => (
                <RenderComponent
                  key={c.id}
                  component={c}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                  onMoveComponents={onMoveComponents}
                />
              ))}
          </LTBox>
        );

      case "lt-typography":
        return <LTTypography properties={component.properties} />;

      case "lt-button":
        return <LTButton properties={component.properties} />;

      case "lt-input":
        return <LTInput properties={component.properties} />;

      case "lt-card":
        return (
          <LTCard properties={component.properties}>
            {component.children &&
              component.children.map((c) => (
                <RenderComponent
                  key={c.id}
                  component={c}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                  onMoveComponents={onMoveComponents}
                />
              ))}
          </LTCard>
        );

      case "lt-image":
        return <LTImage properties={component.properties} />;

      case "lt-data-provider":
        return (
          <LTDataProvider properties={component.properties}>
            {component.children &&
              component.children.map((c) => (
                <RenderComponent
                  key={c.id}
                  component={c}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                  onMoveComponents={onMoveComponents}
                />
              ))}
          </LTDataProvider>
        );

      case "text":
        return (
          <BuilderText properties={boundProps} componentId={component.id} />
        );

      case "image":
        return (
          <BuilderImage properties={boundProps} componentId={component.id} />
        );

      case "button":
        return (
          <BuilderButton properties={boundProps} componentId={component.id} />
        );

      case "input":
        return (
          <BuilderInput properties={boundProps} componentId={component.id} />
        );

      case "dropdown":
        return (
          <BuilderDropdown properties={boundProps} componentId={component.id} />
        );

      case "form":
        return (
          <BuilderForm
            properties={component.properties}
            childrenComponents={component.children}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onAddComponent={onAddComponent}
          />
        );

      case "breadcrumbs":
        return <BuilderBreadcrumbs properties={boundProps} />;

      case "tabs":
        return <BuilderTabs properties={boundProps} />;

      case "chip":
        return <BuilderChip properties={boundProps} />;

      case "datagrid": {
        // Determine rows from collection binding or explicit data
        const binding = component.properties.dataBinding;
        let rows: any[] = [];
        if (binding?.collectionId && dataContext) {
          rows = dataContext.dataStore.data[binding.collectionId] || [];
        }

        // Optionally unwrap wrapper objects (e.g. a `search` model which
        // contains `results: [...]`) so the DataGrid receives the inner
        // item rows. This behavior is controlled by
        // `properties.dataBinding.unwrapResults` (defaults to true).
        const shouldUnwrap = binding?.unwrapResults !== false;
        if (
          shouldUnwrap &&
          Array.isArray(rows) &&
          rows.length === 1 &&
          rows[0] != null &&
          Array.isArray(rows[0].results)
        ) {
          rows = rows[0].results;
        }

        return (
          <BuilderDataGrid
            properties={component.properties}
            rows={rows}
            componentId={component.id}
          />
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
              <div
                id={`elem-${component.id}`}
                className={`elem-${component.id}`}
                style={style}
              >
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
                      {children.map((child, cidx) => (
                        <RenderComponent
                          key={`${
                            child.id ?? `${component.id}-child-${cidx}`
                          }-${index}`}
                          component={child}
                          selectedId={selectedId}
                          hoveredId={hoveredId}
                          selectedIds={selectedIds}
                          onSelect={onSelect}
                          onHover={onHover}
                          onAddComponent={onAddComponent}
                          onMoveComponents={onMoveComponents}
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
        // For grid layouts, inserting visible DropSlot elements between
        // children causes those slots to occupy real grid cells, which
        // leads to alternating empty cells. For grids, render the
        // children directly and avoid placing inline DropSlot elements
        // into the normal flow. Keep a trailing append slot so users can
        // drop at the end.
        if (component.type === "grid") {
          return (
            <div
              id={`elem-${component.id}`}
              className={`elem-${component.id}`}
              style={style}
            >
              {children.map((child, cidx) => (
                <RenderComponent
                  key={child.id ?? `${component.id}-child-${cidx}`}
                  component={child}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onHover={onHover}
                  onAddComponent={onAddComponent}
                  onMoveComponents={onMoveComponents}
                />
              ))}

              {/* trailing append slot for grid (not placed between items) */}
              <DropSlot
                parentId={component.id}
                index={children.length}
                parentType={component.type}
              />
            </div>
          );
        }

        return (
          <div style={style}>
            {children.length === 0 ? (
              // When empty, render a single, large DropSlot that acts as the
              // empty-state drop target. This avoids rendering both the
              // `.drop-zone-empty` box and a separate small slot.
              <>
                <DropSlot parentId={component.id} index={0} isEmpty />
              </>
            ) : (
              <>
                {children.map((child, cidx) => (
                  <React.Fragment
                    key={child.id ?? `${component.id}-child-${cidx}`}
                  >
                    <DropSlot
                      parentId={component.id}
                      index={cidx}
                      parentType={component.type}
                    />
                    <RenderComponent
                      component={child}
                      selectedId={selectedId}
                      hoveredId={hoveredId}
                      selectedIds={selectedIds}
                      onSelect={onSelect}
                      onHover={onHover}
                      onAddComponent={onAddComponent}
                      onMoveComponents={onMoveComponents}
                    />
                  </React.Fragment>
                ))}

                {/* end slot to append after last child */}
                <DropSlot
                  parentId={component.id}
                  index={children.length}
                  parentType={component.type}
                />
              </>
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
      ref={(el: any) => {
        if (!el) return;
        try {
          drag(el);
        } catch {}
        // Attach the drop handler for all layout-capable nodes so empty
        // LT containers (e.g. `lt-data-provider`, `lt-box`, `lt-card`)
        // accept drops from the canvas. Previously drop() was only
        // attached when a node already had children which prevented
        // dropping into an empty provider via the canvas.
        if (isLayout) {
          try {
            (drop as any)(el);
          } catch {}
        }
      }}
      id={`elem-${component.id}`}
      className={`elem-${component.id} rendered-component ${
        isSelected ? "selected" : ""
      } ${isHovered ? "hovered" : ""} ${isOver ? "drop-over" : ""}`}
      style={{ position: "relative" }}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
    >
      {isLayout && isOver && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            border: "2px dashed #2563eb",
            borderRadius: 8,
            backgroundColor: "rgba(37,99,235,0.03)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}
      {isSelected && (
        <div className="component-label-tag">{component.type}</div>
      )}
      {component.properties?.visibilityExpression && isSelected && (
        <div
          className="component-visibility-tag"
          style={{
            position: "absolute",
            right: 6,
            top: 6,
            background: "#fff",
            border: "1px dashed #ccc",
            padding: "4px 6px",
            fontSize: 11,
            zIndex: 6,
          }}
        >
          Bound: {component.properties.visibilityExpression}
        </div>
      )}
      {renderContent()}
    </div>
  );
};
