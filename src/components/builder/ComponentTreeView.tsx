import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { BuilderComponent } from "../../types";
import {
  Grid as GridIcon,
  Columns as ColumnsIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Type as TextIcon,
  Square as BoxIcon,
  File as FileIcon,
} from "lucide-react";
import "./ComponentTreeView.css";

interface TreeProps {
  components: BuilderComponent[];
  selectedId: string | null;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onSelect: (id: string | null) => void;
  onMoveComponents: (ids: string[], parentId?: string, index?: number) => void;
  onAddComponent?: (type: any, parentId?: string, index?: number) => void;
}

const TreeItem: React.FC<{
  node: BuilderComponent;
  level?: number;
  parentId?: string | null;
  indexWithinParent?: number;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onSelect: (id: string | null) => void;
  onMoveComponents: (ids: string[], parentId?: string, index?: number) => void;
  onAddComponent?: (type: any, parentId?: string, index?: number) => void;
}> = ({
  node,
  level = 0,
  parentId,
  indexWithinParent,
  selectedIds,
  setSelectedIds,
  onSelect,
  onMoveComponents,
  onAddComponent,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Drag payload: include all selected ids if this node is selected, otherwise just this node
  const dragIds = selectedIds.includes(node.id) ? selectedIds : [node.id];
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "MOVE_COMPONENT",
      item: { ids: dragIds },
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [dragIds]
  );

  // whether this node accepts children (layout-like)
  // include LT-prefixed container types so the tree allows dropping into them
  const isLayoutNode = [
    "flex",
    "grid",
    "row",
    "column",
    "form",
    "lt-box",
    "lt-card",
    "lt-data-provider",
    "lt-list",
    "lt-nav",
  ].includes(node.type as string);

  // Node drop: accept move items (reparent) and new components from palette
  const [{ isOver: nodeOver }, nodeDrop] = useDrop(
    () => ({
      accept: ["MOVE_COMPONENT", "COMPONENT"],
      drop: (item: any, monitor) => {
        if (monitor.didDrop && monitor.didDrop()) return;
        if (item.ids && item.ids.length > 0) {
          onMoveComponents(item.ids, node.id);
          return { moved: true };
        }
        if (item.componentType && onAddComponent) {
          onAddComponent(item.componentType, node.id);
          return { added: true };
        }
      },
      collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
      canDrop: () => isLayoutNode,
    }),
    [node.id, onMoveComponents, onAddComponent, isLayoutNode]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod) {
      // toggle
      if (selectedIds.includes(node.id)) {
        setSelectedIds(selectedIds.filter((s) => s !== node.id));
      } else {
        setSelectedIds([...selectedIds, node.id]);
      }
      onSelect(node.id);
    } else {
      setSelectedIds([node.id]);
      onSelect(node.id);
    }
  };

  return (
    <div className="tree-node" style={{ paddingLeft: level * 12 }}>
      <div
        className={`tree-node-row ${
          selectedIds.includes(node.id) ? "selected" : ""
        }`}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={(el: any) => {
          if (!el) return;
          try {
            drag(el);
          } catch {}
          try {
            nodeDrop(el);
          } catch {}
        }}
        onClick={handleClick}
        style={{ opacity: isDragging ? 0.6 : 1 }}
      >
        <div
          className="chevron"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {node.children && node.children.length > 0
            ? expanded
              ? "▾"
              : "▸"
            : ""}
        </div>
        <div className="drag-handle">≡</div>
        <div className="icon">{renderIconForType(node.type)}</div>
        <div className="label">{node.type}</div>
        <div className="meta">{node.id.slice(0, 6)}</div>
      </div>
      {expanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((c, idx) => (
            <React.Fragment key={c.id}>
              {/* drop zone before child to support ordering */}
              <TreeDropZone
                parentId={node.id}
                index={idx}
                onMove={onMoveComponents}
                onAdd={onAddComponent}
              />
              <TreeItem
                key={c.id}
                node={c}
                level={level + 1}
                parentId={node.id}
                indexWithinParent={idx}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onSelect={onSelect}
                onMoveComponents={onMoveComponents}
                onAddComponent={onAddComponent}
              />
            </React.Fragment>
          ))}
          {/* trailing drop zone to append at end */}
          <TreeDropZone
            parentId={node.id}
            index={node.children.length}
            onMove={onMoveComponents}
            onAdd={onAddComponent}
          />
        </div>
      )}
    </div>
  );
};

function renderIconForType(type: string) {
  switch (type) {
    case "grid":
      return <GridIcon size={14} />;
    case "flex":
      return <ColumnsIcon size={14} />;
    case "image":
      return <ImageIcon size={14} />;
    case "text":
      return <TextIcon size={14} />;
    case "button":
      return <BoxIcon size={14} />;
    case "input":
    case "dropdown":
      return <EditIcon size={14} />;
    // LT-prefixed variants
    case "lt-image":
      return <ImageIcon size={14} />;
    case "lt-typography":
      return <TextIcon size={14} />;
    case "lt-button":
      return <BoxIcon size={14} />;
    case "lt-box":
      return <BoxIcon size={14} />;
    case "lt-card":
      return <GridIcon size={14} />;
    case "lt-data-provider":
      return <FileIcon size={14} />;
    default:
      return <FileIcon size={14} />;
  }
}

export const ComponentTreeView: React.FC<TreeProps> = ({
  components,
  selectedId,
  selectedIds,
  setSelectedIds,
  onSelect,
  onMoveComponents,
  onAddComponent,
}) => {
  useEffect(() => {
    // sync single selection into multi-selection when external selectedId changes
    if (!selectedId) {
      setSelectedIds([]);
    } else if (!selectedIds.includes(selectedId)) {
      setSelectedIds([selectedId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div style={{ maxHeight: "60vh", overflow: "auto" }}>
      {components.length === 0 ? (
        <div style={{ padding: 8, color: "#666" }}>No components</div>
      ) : (
        components.map((c, idx) => (
          <React.Fragment key={c.id}>
            <TreeDropZone
              parentId={undefined}
              index={idx}
              onMove={onMoveComponents}
              onAdd={onAddComponent}
            />
            <TreeItem
              node={c}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onSelect={onSelect}
              onMoveComponents={onMoveComponents}
              onAddComponent={onAddComponent}
            />
          </React.Fragment>
        ))
      )}
    </div>
  );
};

export default ComponentTreeView;

// Drop zone component used between siblings and at root to support ordering
const TreeDropZone: React.FC<{
  parentId?: string | null;
  index: number;
  onMove?: (ids: string[], parentId?: string | null, index?: number) => void;
  onAdd?:
    | ((type: any, parentId?: string | null, index?: number) => void)
    | undefined;
}> = ({ parentId, index, onMove, onAdd }) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ["MOVE_COMPONENT", "COMPONENT"],
      drop: (item: any, monitor) => {
        if (monitor.didDrop && monitor.didDrop()) return;
        if (item.ids && item.ids.length > 0) {
          onMove && onMove(item.ids, parentId ?? undefined, index);
          return { moved: true };
        }
        if (item.componentType && onAdd) {
          onAdd(item.componentType, parentId ?? undefined, index);
          return { added: true };
        }
      },
      collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
    }),
    [parentId, index, onMove, onAdd]
  );

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drop as any}
      style={{
        height: 8,
        margin: "4px 0",
        background: isOver ? "rgba(37,99,235,0.08)" : "transparent",
        borderRadius: 4,
      }}
    />
  );
};
