import { useDrag } from "react-dnd";
import type { ComponentType, BuilderComponent } from "../types";
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
import type { Dispatch, SetStateAction } from "react";

interface ComponentLibraryProps {
  components?: BuilderComponent[];
  selectedId?: string | null;
  selectedIds?: string[];
  setSelectedIds?: Dispatch<SetStateAction<string[]>>;
  onSelect?: (id: string | null) => void;
  onMoveComponents?: (ids: string[], parentId?: string, index?: number) => void;
  onAddComponent?: (
    type: ComponentType,
    parentId?: string,
    index?: number
  ) => void;
}

interface ComponentLibraryItemProps {
  type: ComponentType;
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
      <h3>Components</h3>

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

      <div style={{ marginTop: 12 }}>
        <h4>Hierarchy</h4>
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
    </div>
  );
};
