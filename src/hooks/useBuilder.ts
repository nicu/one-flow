import { useState, useCallback } from "react";
import type {
  BuilderComponent,
  ComponentProperties,
  AllComponentType,
} from "../types";
import { v4 as uuidv4 } from "uuid";

export const useBuilder = () => {
  const [components, setComponentsState] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // history stacks
  const [past, setPast] = useState<BuilderComponent[][]>([]);
  const [future, setFuture] = useState<BuilderComponent[][]>([]);

  const recordSnapshot = useCallback((prev: BuilderComponent[]) => {
    try {
      const snap = JSON.parse(JSON.stringify(prev)) as BuilderComponent[];
      setPast((p) => [...p, snap]);
    } catch {
      // ignore
    }
  }, []);

  // wrapper to set components and optionally record history
  const setComponents = useCallback(
    (
      next:
        | BuilderComponent[]
        | ((prev: BuilderComponent[]) => BuilderComponent[]),
      record = true
    ) => {
      if (typeof next === "function") {
        setComponentsState((prev) => {
          const computed = (
            next as (p: BuilderComponent[]) => BuilderComponent[]
          )(prev);
          if (record) {
            recordSnapshot(prev);
            setFuture([]);
          }
          return computed;
        });
      } else {
        setComponentsState((prev) => {
          if (record) {
            recordSnapshot(prev);
            setFuture([]);
          }
          return next;
        });
      }
    },
    [recordSnapshot]
  );

  const addComponent = useCallback(
    (type: AllComponentType, parentId?: string | null, index?: number) => {
      const newComponent: BuilderComponent = {
        id: uuidv4(),
        type,
        properties: getDefaultProperties(type),
        // Initialize children for layout-capable components. Extend
        // layout detection to include LT-prefixed container types so
        // components like `lt-data-provider` can receive children when
        // created and accept drops from the canvas/palette.
        children: isLayoutComponent(type) ? [] : undefined,
      };

      if (parentId) {
        setComponents(
          (prev) => addToParent(prev, parentId, newComponent, index),
          true
        );
      } else {
        setComponents((prev) => [...prev, newComponent], true);
      }

      setSelectedId(newComponent.id);
      return newComponent.id;
    },
    [setComponents]
  );

  const updateComponent = useCallback(
    (id: string, properties: Partial<ComponentProperties>) => {
      setComponents((prev) => updateComponentById(prev, id, properties), true);
    },
    [setComponents]
  );

  const removeComponent = useCallback(
    (id: string) => {
      setComponents((prev) => removeComponentById(prev, id), true);
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId, setComponents]
  );

  const moveComponents = useCallback(
    (ids: string[], parentId?: string | null, index?: number) => {
      if (!ids || ids.length === 0) return;

      setComponents((prev) => {
        const idsSet = new Set(ids);

        // Extract matching components and return remaining tree
        const extract = (
          nodes: BuilderComponent[]
        ): { remaining: BuilderComponent[]; extracted: BuilderComponent[] } => {
          const remaining: BuilderComponent[] = [];
          const extracted: BuilderComponent[] = [];

          for (const node of nodes) {
            if (idsSet.has(node.id)) {
              // collect extracted (deep clone to avoid accidental shared refs)
              extracted.push(
                JSON.parse(JSON.stringify(node)) as BuilderComponent
              );
              continue;
            }

            if (node.children) {
              const childRes = extract(node.children);
              if (childRes.extracted.length > 0) {
                extracted.push(...childRes.extracted);
              }
              // If some children were removed, create a shallow copy with remaining children
              if (childRes.remaining.length !== node.children.length) {
                remaining.push({ ...node, children: childRes.remaining });
                continue;
              }
            }

            remaining.push(node);
          }

          return { remaining, extracted };
        };

        const { remaining, extracted } = extract(prev);

        // If no extracted nodes, nothing to do
        if (extracted.length === 0) return prev;

        // Prevent moving a node into its own descendant: if parentId is inside any extracted node, ignore
        const containsId = (node: BuilderComponent, id: string): boolean => {
          if (node.id === id) return true;
          if (!node.children) return false;
          return node.children.some((c) => containsId(c, id));
        };

        if (parentId) {
          for (const ex of extracted) {
            if (containsId(ex, parentId)) {
              // invalid move, return original
              return prev;
            }
          }
        }

        // Insert extracted items into parent or root at index
        const insertInto = (
          nodes: BuilderComponent[],
          parentId?: string | null
        ): BuilderComponent[] => {
          if (!parentId) {
            const next = nodes.slice();
            if (typeof index === "number") {
              const idx = Math.max(0, Math.min(index, next.length));
              next.splice(idx, 0, ...extracted);
            } else {
              next.push(...extracted);
            }
            return next;
          }

          return nodes.map((node) => {
            if (node.id === parentId) {
              const nextChildren = (node.children || []).slice();
              if (typeof index === "number") {
                const idx = Math.max(0, Math.min(index, nextChildren.length));
                nextChildren.splice(idx, 0, ...extracted);
              } else {
                nextChildren.push(...extracted);
              }
              return { ...node, children: nextChildren };
            }
            if (node.children) {
              return { ...node, children: insertInto(node.children, parentId) };
            }
            return node;
          });
        };

        const next = insertInto(remaining, parentId);
        // Select first moved component
        setSelectedId(extracted[0].id);
        return next;
      }, true);
    },
    [setComponents]
  );

  const selectComponent = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedIds(id ? [id] : []);
  }, []);

  const getSelectedComponent = useCallback((): BuilderComponent | null => {
    if (!selectedId) return null;
    return findComponentById(components, selectedId);
  }, [components, selectedId]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [JSON.parse(JSON.stringify(components)), ...f]);
      setComponentsState(previous);
      return p.slice(0, -1);
    });
  }, [components]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, JSON.parse(JSON.stringify(components))]);
      setComponentsState(next);
      return f.slice(1);
    });
  }, [components]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    components,
    selectedId,
    selectedIds,
    setSelectedIds,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponents,
    selectComponent,
    getSelectedComponent,
    setComponents,
    undo,
    redo,
    canUndo,
    canRedo,
    hoveredId,
    setHoveredId,
  };
};

// Helper functions
const getDefaultProperties = (
  type: AllComponentType
): ComponentProperties => {
  const defaults: Partial<Record<AllComponentType, ComponentProperties>> = {
    text: {
      text: "Sample Text",
      fontSize: "16px",
      color: "#000000",
      alignment: "left",
    },
    box: {
      padding: "8px",
      backgroundColor: "#ffffff",
      minHeight: "40px",
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
      label: "",
    },
    dropdown: {
      options: ["Option 1", "Option 2", "Option 3"],
    },
    flex: {
      flexDirection: "row",
      gap: "10px",
      padding: "20px",

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
    datagrid: {
      columns: [],
      pageSize: 5,
    },
    breadcrumbs: {
      breadcrumbs: [],
    },
    tabs: {
      tabField: "",
      gap: "8px",
    },
    chip: {
      chipField: "",
    },
    form: {
      padding: "16px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      minHeight: "60px",
      width: "100%",
    },
  };
  // Return an empty object for unknown types to avoid undefined
  // properties on newly created components (helps LT components
  // which may not be listed in the defaults map yet).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (defaults as any)[type] || ({} as ComponentProperties);
};

const isLayoutComponent = (type: AllComponentType): boolean => {
  // Treat LT container types as layout-capable so they receive
  // children and behave like other layout components.
  return [
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
  ].includes(type as string);
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
  newComponent: BuilderComponent,
  index?: number
): BuilderComponent[] => {
  return components.map((component) => {
    if (component.id === parentId) {
      // Ensure the parent has a children array; allow adding even when
      // it wasn't initialized (this happens for LT containers created
      // before we started treating them as layout components).
      const nextChildren = (component.children || []).slice();

      // If the parent is an LT Data Provider and it exposes a specific
      // model, pre-bind the new child's dataBinding.modelId to that
      // provider so children added directly into a provider default to
      // using the provider's data without manual selection.
      const newChild = { ...newComponent } as any;
      try {
        if (component.type === "lt-data-provider") {
          const provId =
            (component.properties as any)?.providerId ||
            (component.properties as any)?.dataBinding?.modelId;
          if (provId) {
            newChild.properties = {
              ...(newChild.properties || {}),
              dataBinding: {
                ...(newChild.properties?.dataBinding || {}),
                modelId: provId,
              },
            };
          }
        }
      } catch (e) {
        // ignore
      }

      if (
        typeof index === "number" &&
        index >= 0 &&
        index <= nextChildren.length
      ) {
        nextChildren.splice(index, 0, newChild);
      } else {
        nextChildren.push(newChild);
      }
      return {
        ...component,
        children: nextChildren,
      };
    }
    if (component.children) {
      return {
        ...component,
        children: addToParent(
          component.children,
          parentId,
          newComponent,
          index
        ),
      };
    }
    return component;
  });
};
