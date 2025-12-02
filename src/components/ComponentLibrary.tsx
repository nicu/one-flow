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
import {
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from "react";

interface ComponentLibraryProps {
  components?: BuilderComponent[];
  selectedId?: string | null;
  selectedIds?: string[];
  setSelectedIds?: Dispatch<SetStateAction<string[]>>;
  onSelect?: (id: string | null) => void;
  onMoveComponents?: (ids: string[], parentId?: string, index?: number) => void;
  onAddComponent?: (
    type: AllComponentType,
    parentId?: string,
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
    { type: "text" as ComponentType, label: "Text", icon: <Type size={20} /> },
    {
      type: "image" as ComponentType,
      label: "Image",
      icon: <ImageIcon size={20} />,
    },
    {
      type: "button" as ComponentType,
      label: "Button",
      icon: <Square size={20} />,
    },
    {
      type: "input" as ComponentType,
      label: "Input",
      icon: <Edit size={20} />,
    },
    {
      type: "form" as ComponentType,
      label: "Form",
      icon: <Edit size={20} />,
    },
    {
      type: "dropdown" as ComponentType,
      label: "Dropdown",
      icon: <ChevronDown size={20} />,
    },
    {
      type: "datagrid" as ComponentType,
      label: "Data Grid",
      icon: <GridIcon size={20} />,
    },
    {
      type: "breadcrumbs" as ComponentType,
      label: "Breadcrumbs",
      icon: <ChevronDown size={20} />,
    },
    {
      type: "tabs" as ComponentType,
      label: "Tabs",
      icon: <Columns size={20} />,
    },
    {
      type: "chip" as ComponentType,
      label: "Chip",
      icon: <Columns size={20} />,
    },
  ];

  const lateralLTComponents = [
    {
      type: "lt-box" as ComponentType,
      label: "LT Box",
      icon: <Square size={18} />,
    },
    {
      type: "lt-typography" as ComponentType,
      label: "LT Typography",
      icon: <Type size={18} />,
    },
    {
      type: "lt-button" as ComponentType,
      label: "LT Button",
      icon: <Square size={18} />,
    },
    {
      type: "lt-input" as ComponentType,
      label: "LT Input",
      icon: <Edit size={18} />,
    },
    {
      type: "lt-card" as ComponentType,
      label: "LT Card",
      icon: <GridIcon size={18} />,
    },
    {
      type: "lt-image" as ComponentType,
      label: "LT Image",
      icon: <ImageIcon size={18} />,
    },
    {
      type: "lt-data-provider" as ComponentType,
      label: "LT Data Provider",
      icon: <Columns size={18} />,
    },
  ];

  const layoutComponents = [
    {
      type: "flex" as ComponentType,
      label: "Flex",
      icon: <Columns size={20} />,
    },
    {
      type: "grid" as ComponentType,
      label: "Grid",
      icon: <GridIcon size={20} />,
    },
    {
      type: "row" as ComponentType,
      label: "Row",
      icon: <ArrowRight size={20} />,
    },
    {
      type: "column" as ComponentType,
      label: "Column",
      icon: <ArrowDown size={20} />,
    },
  ];

  return (
    <div className="component-library">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Library</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            className={`tab-btn ${activeTab === "components" ? "active" : ""}`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            className={`tab-btn ${activeTab === "layers" ? "active" : ""}`}
            onClick={() => setActiveTab("layers")}
          >
            Layers
          </button>
        </div>
      </div>

      {activeTab === "components" && (
        <>
          <div className="component-section">
            <h4>Primitives</h4>
            <div className="component-grid">
              {primitiveComponents.map((comp) => (
                <ComponentLibraryItem key={comp.type} {...comp} />
              ))}
            </div>
          </div>

          <div className="component-section">
            <h4>Layout</h4>
            <div className="component-grid">
              {layoutComponents.map((comp) => (
                <ComponentLibraryItem key={comp.type} {...comp} />
              ))}
            </div>
          </div>

          <div className="component-section">
            <h4>Lateral (LT)</h4>
            <div className="component-grid">
              {lateralLTComponents.map((comp) => (
                <ComponentLibraryItem key={comp.type} {...comp} />
              ))}
            </div>
          </div>
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
