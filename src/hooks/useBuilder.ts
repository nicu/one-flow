import { useState, useCallback } from "react";
import type {
  BuilderComponent,
  ComponentType,
  ComponentProperties,
} from "../types";
import { v4 as uuidv4 } from "uuid";

export const useBuilder = () => {
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addComponent = useCallback((type: ComponentType, parentId?: string) => {
    const newComponent: BuilderComponent = {
      id: uuidv4(),
      type,
      properties: getDefaultProperties(type),
      children: isLayoutComponent(type) ? [] : undefined,
    };

    if (parentId) {
      setComponents((prev) => addToParent(prev, parentId, newComponent));
    } else {
      setComponents((prev) => [...prev, newComponent]);
    }

    setSelectedId(newComponent.id);
    return newComponent.id;
  }, []);

  const updateComponent = useCallback(
    (id: string, properties: Partial<ComponentProperties>) => {
      setComponents((prev) => updateComponentById(prev, id, properties));
    },
    []
  );

  const removeComponent = useCallback(
    (id: string) => {
      setComponents((prev) => removeComponentById(prev, id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  const selectComponent = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const getSelectedComponent = useCallback((): BuilderComponent | null => {
    if (!selectedId) return null;
    return findComponentById(components, selectedId);
  }, [components, selectedId]);

  return {
    components,
    selectedId,
    addComponent,
    updateComponent,
    removeComponent,
    selectComponent,
    getSelectedComponent,
    setComponents,
  };
};

// Helper functions
const getDefaultProperties = (type: ComponentType): ComponentProperties => {
  const defaults: Record<ComponentType, ComponentProperties> = {
    text: {
      text: "Sample Text",
      fontSize: "16px",
      color: "#000000",
      alignment: "left",
    },
    image: {
      src: "https://via.placeholder.com/300x200",
      alt: "Placeholder",
      width: "300px",
      height: "200px",
    },
    button: {
      buttonText: "Click Me",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      padding: "10px 20px",
    },
    input: {
      placeholder: "Enter text...",
      inputType: "text",
      width: "200px",
    },
    dropdown: {
      options: ["Option 1", "Option 2", "Option 3"],
      width: "200px",
    },
    flex: {
      flexDirection: "row",
      gap: "10px",
      padding: "20px",
      backgroundColor: "#f5f5f5",
      minHeight: "100px",
    },
    grid: {
      gridColumns: 2,
      gridRows: 2,
      gap: "10px",
      padding: "20px",
      backgroundColor: "#f5f5f5",
      minHeight: "200px",
    },
    row: {
      flexDirection: "row",
      gap: "10px",
      padding: "10px",
      backgroundColor: "#f9f9f9",
    },
    column: {
      flexDirection: "column",
      gap: "10px",
      padding: "10px",
      backgroundColor: "#f9f9f9",
    },
  };
  return defaults[type];
};

const isLayoutComponent = (type: ComponentType): boolean => {
  return ["flex", "grid", "row", "column"].includes(type);
};

const findComponentById = (
  components: BuilderComponent[],
  id: string
): BuilderComponent | null => {
  for (const component of components) {
    if (component.id === id) return component;
    if (component.children) {
      const found = findComponentById(component.children, id);
      if (found) return found;
    }
  }
  return null;
};

const updateComponentById = (
  components: BuilderComponent[],
  id: string,
  properties: Partial<ComponentProperties>
): BuilderComponent[] => {
  return components.map((component) => {
    if (component.id === id) {
      return {
        ...component,
        properties: { ...component.properties, ...properties },
      };
    }
    if (component.children) {
      return {
        ...component,
        children: updateComponentById(component.children, id, properties),
      };
    }
    return component;
  });
};

const removeComponentById = (
  components: BuilderComponent[],
  id: string
): BuilderComponent[] => {
  return components
    .filter((component) => component.id !== id)
    .map((component) => {
      if (component.children) {
        return {
          ...component,
          children: removeComponentById(component.children, id),
        };
      }
      return component;
    });
};

const addToParent = (
  components: BuilderComponent[],
  parentId: string,
  newComponent: BuilderComponent
): BuilderComponent[] => {
  return components.map((component) => {
    if (component.id === parentId && component.children) {
      return {
        ...component,
        children: [...component.children, newComponent],
      };
    }
    if (component.children) {
      return {
        ...component,
        children: addToParent(component.children, parentId, newComponent),
      };
    }
    return component;
  });
};
