import { useDrag } from "react-dnd";
import type { AllComponentType, BuilderComponent } from "../types";
import {
  Type,
  Image as ImageIcon,
  Square,
  Edit,
  ChevronDown,
  Columns,
  Grid as GridIcon,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import ComponentTreeView from "./builder/ComponentTreeView";
import { useState, type Dispatch, type SetStateAction } from "react";

interface ComponentLibraryProps {
  components?: BuilderComponent[];
  selectedId?: string | null;
  selectedIds?: string[];
  setSelectedIds?: Dispatch<SetStateAction<string[]>>;
  onSelect?: (id: string | null) => void;
  onMoveComponents?: (
    ids: string[],
    parentId?: string | null,
    index?: number
  ) => void;
  onAddComponent?: (
    type: AllComponentType,
    parentId?: string | null,
    index?: number
  ) => void;
}

interface ComponentLibraryItemProps {
  type: AllComponentType;
  label: string;
  icon: React.ReactNode;
}

export const ComponentLibraryItem: React.FC<ComponentLibraryItemProps> = ({
  type,
  label,
  icon,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "COMPONENT",
    item: { componentType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drag as any}
      className="component-library-item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      <div className="component-icon">{icon}</div>
      <div className="component-label">{label}</div>
    </div>
  );
};

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  components = [],
  selectedId = null,
  selectedIds = [],
  setSelectedIds = () => {},
  onSelect = () => {},
  onMoveComponents = () => {},
  onAddComponent = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<"components" | "layers">(
    "components"
  );
  const primitiveComponents = [
    {
      type: "text" as AllComponentType,
      label: "Text",
      icon: <Type size={20} />,
    },
    {
      type: "box" as AllComponentType,
      label: "Box",
      icon: <Square size={20} />,
    },
    {
      type: "image" as AllComponentType,
      label: "Image",
      icon: <ImageIcon size={20} />,
    },
    {
      type: "button" as AllComponentType,
      label: "Button",
      icon: <Square size={20} />,
    },
    {
      type: "input" as AllComponentType,
      label: "Input",
      icon: <Edit size={20} />,
    },
    {
      type: "form" as AllComponentType,
      label: "Form",
      icon: <Edit size={20} />,
    },
    {
      type: "dropdown" as AllComponentType,
      label: "Dropdown",
      icon: <ChevronDown size={20} />,
    },
    {
      type: "datagrid" as AllComponentType,
      label: "Data Grid",
      icon: <GridIcon size={20} />,
    },
    {
      type: "breadcrumbs" as AllComponentType,
      label: "Breadcrumbs",
      icon: <ChevronDown size={20} />,
    },
    {
      type: "tabs" as AllComponentType,
      label: "Tabs",
      icon: <Columns size={20} />,
    },
    {
      type: "chip" as AllComponentType,
      label: "Chip",
      icon: <Columns size={20} />,
    },
  ];

  // LT components intentionally hidden for now — using primitives instead

  const layoutComponents = [
    {
      type: "flex" as AllComponentType,
      label: "Flex",
      icon: <Columns size={20} />,
    },
    {
      type: "grid" as AllComponentType,
      label: "Grid",
      icon: <GridIcon size={20} />,
    },
    {
      type: "row" as AllComponentType,
      label: "Row",
      icon: <ArrowRight size={20} />,
    },
    {
      type: "column" as AllComponentType,
      label: "Column",
      icon: <ArrowDown size={20} />,
    },
    {
      type: "ScrollReveal" as AllComponentType,
      label: "Scroll Reveal",
      icon: <ArrowDown size={20} />,
    },
  ];

  return (
    <div className="component-library">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ marginBottom: "8px" }}>
          <div className="viewport-controls">
            <button
              className={`viewport-btn ${
                activeTab === "components" ? "active" : ""
              }`}
              onClick={() => setActiveTab("components")}
            >
              Components
            </button>
            <button
              className={`viewport-btn ${
                activeTab === "layers" ? "active" : ""
              }`}
              onClick={() => setActiveTab("layers")}
            >
              Layers
            </button>
          </div>
        </div>
      </div>

      {activeTab === "components" && (
        <>
          <div className="component-section">
            <h4>Primitives</h4>
            <div className="component-grid">
              {primitiveComponents.map((comp) => (
                <ComponentLibraryItem key={String(comp.type)} {...comp} />
              ))}
            </div>
          </div>

          <div className="component-section">
            <h4>Layout</h4>
            <div className="component-grid">
              {layoutComponents.map((comp) => (
                <ComponentLibraryItem key={String(comp.type)} {...comp} />
              ))}
            </div>
          </div>

          <div className="component-section">
            <h4>Components</h4>
            <div className="component-grid">
              {[
                {
                  type: "image-grid" as AllComponentType,
                  label: "Image Grid",
                  icon: <ImageIcon size={20} />,
                },
                {
                  type: "lazy-user-list" as AllComponentType,
                  label: "Lazy User List",
                  icon: <ImageIcon size={20} />,
                },
              ].map((comp) => (
                <ComponentLibraryItem key={String(comp.type)} {...comp} />
              ))}
            </div>
          </div>

          {/* LT components hidden — authors should use primitives */}
        </>
      )}

      {activeTab === "layers" && (
        <div style={{ marginTop: 12 }}>
          <h4>Layers</h4>
          <ComponentTreeView
            components={components}
            selectedId={selectedId}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onSelect={onSelect}
            onMoveComponents={onMoveComponents}
            onAddComponent={onAddComponent}
          />
        </div>
      )}
    </div>
  );
};
