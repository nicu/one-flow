import React, { useState, useEffect } from "react";
import type { ComponentProperties, BuilderComponent } from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { BuilderInput } from "./BuilderInput";
import { BuilderDropdown } from "./BuilderDropdown";
import { BuilderButton } from "./BuilderButton";
import { RenderComponent } from "../RenderComponent";

interface Props {
  properties: ComponentProperties;
  childrenComponents?: BuilderComponent[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  onAddComponent?: (type: any, parentId?: string, index?: number) => void;
}

// Helpers to get/set nested paths like 'name.first'
const getValueAtPath = (
  obj: Record<string, any> | undefined,
  path?: string
) => {
  if (!path || !obj) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

const setValueAtPath = (obj: Record<string, any>, path: string, value: any) => {
  const parts = path.split(".");
  const last = parts.pop() as string;
  let cur: any = obj;
  for (const p of parts) {
    if (cur[p] == null) cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
};

export const BuilderForm: React.FC<Props> = ({
  properties,
  childrenComponents = [],
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onAddComponent,
}) => {
  const dataContext = useDataContext();
  const binding = properties.dataBinding;
  const modelId = binding?.modelId;

  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // initialize values from data store (first item)
  useEffect(() => {
    if (!dataContext || !modelId) return;
    const data = dataContext.dataStore.data[modelId];
    if (Array.isArray(data) && data.length > 0) {
      try {
        setValues(JSON.parse(JSON.stringify(data[0])));
      } catch {
        setValues(data[0]);
      }
    }
  }, [dataContext, modelId]);

  const handleChange = (fieldPath: string, v: any) => {
    setValues((prev) => {
      const copy = JSON.parse(JSON.stringify(prev || {}));
      setValueAtPath(copy, fieldPath, v);
      return copy;
    });
  };

  const runValidationsForField = (
    child: BuilderComponent | undefined,
    value: any
  ) => {
    if (!child) return undefined;
    const vRules: any[] = (child.properties as any).validations || [];
    for (const rule of vRules) {
      if (rule.type === "required") {
        if (value == null || String(value).trim() === "") return "Required";
      }
      if (rule.type === "duplicate") {
        const forbidden = rule.forbiddenValue ?? "ONE";
        if (String(value) === String(forbidden))
          return rule.message || `Value cannot be '${forbidden}'`;
      }
    }
    return undefined;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate each child that represents a field
    for (const child of childrenComponents) {
      if (child.type === "input" || child.type === "dropdown") {
        const fieldPath = child.properties?.dataBinding?.fieldId;
        if (!fieldPath) continue;
        const val = getValueAtPath(values, fieldPath) ?? "";
        const err = runValidationsForField(child, val);
        if (err) newErrors[fieldPath] = err;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // No errors -> persist back to data store (replace first item)
    if (dataContext && dataContext.setDataStore && modelId) {
      const ds = dataContext.dataStore;
      const cur = ds.data[modelId] || [];
      const updated = [...cur];
      if (updated.length > 0) {
        updated[0] = values;
      } else {
        updated.push(values);
      }
      const newStore = { ...ds, data: { ...ds.data, [modelId]: updated } };
      dataContext.setDataStore(newStore);
    }
  };

  const renderNode = (node: BuilderComponent): React.ReactNode => {
    const childType = node.type;

    // INPUT: keep interactive behavior (value/onChange/editable)
    if (childType === "input") {
      const fieldPath = node.properties?.dataBinding?.fieldId || "";
      const p = node.properties as Record<string, unknown>;
      const label = (p.label as string) || fieldPath;
      const validations = p.validations as unknown as Array<
        Record<string, unknown>
      >;
      const isRequired = Array.isArray(validations)
        ? validations.some((v) => String(v.type) === "required")
        : false;
      const labelText = label + (isRequired ? " *" : "");
      const rawVal = getValueAtPath(values, fieldPath);
      const val =
        rawVal == null
          ? ""
          : typeof rawVal === "object"
          ? JSON.stringify(rawVal)
          : rawVal;
      const isSelected = selectedId === node.id;
      const isHoveredLocal = hoveredId === node.id;
      const wrapperStyle: React.CSSProperties = {
        marginBottom: 10,
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        border: isSelected
          ? "2px solid #2563eb"
          : isHoveredLocal
          ? "1px dashed #9ca3af"
          : "1px solid transparent",
        backgroundColor: isSelected
          ? "#e6f0ff"
          : isHoveredLocal
          ? "#fbfdff"
          : undefined,
      };
      const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: 12,
        marginBottom: 4,
        fontWeight: isSelected ? 700 : 400,
      };

      return (
        <div
          key={node.id}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(node.id);
          }}
          onMouseOver={(e) => {
            e.stopPropagation();
            if (onHover) onHover(node.id);
          }}
          onMouseLeave={() => {
            if (onHover) onHover(null);
          }}
          style={wrapperStyle}
        >
          <label style={labelStyle}>{labelText}</label>
          <BuilderInput
            properties={node.properties}
            value={val as string}
            onChange={(v) => handleChange(fieldPath, v)}
            editable
            showLabel={false}
          />
          {errors[fieldPath] && (
            <div style={{ color: "#c53030", fontSize: 12 }}>
              {errors[fieldPath]}
            </div>
          )}
        </div>
      );
    }

    // DROPDOWN: interactive
    if (childType === "dropdown") {
      const fieldPath = node.properties?.dataBinding?.fieldId || "";
      const p2 = node.properties as Record<string, unknown>;
      const label = (p2.label as string) || fieldPath;
      const validations = p2.validations as unknown as Array<
        Record<string, unknown>
      >;
      const isRequired = Array.isArray(validations)
        ? validations.some((v) => String(v.type) === "required")
        : false;
      const labelText = label + (isRequired ? " *" : "");
      const rawVal = getValueAtPath(values, fieldPath);
      const val =
        rawVal == null
          ? ""
          : typeof rawVal === "object"
          ? JSON.stringify(rawVal)
          : rawVal;
      const isSelected = selectedId === node.id;
      const isHoveredLocal = hoveredId === node.id;
      const wrapperStyle: React.CSSProperties = {
        marginBottom: 10,
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        border: isSelected
          ? "2px solid #2563eb"
          : isHoveredLocal
          ? "1px dashed #9ca3af"
          : "1px solid transparent",
        backgroundColor: isSelected
          ? "#e6f0ff"
          : isHoveredLocal
          ? "#fbfdff"
          : undefined,
      };
      const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: 12,
        marginBottom: 4,
        fontWeight: isSelected ? 700 : 400,
      };

      return (
        <div
          key={node.id}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(node.id);
          }}
          onMouseOver={(e) => {
            e.stopPropagation();
            if (onHover) onHover(node.id);
          }}
          onMouseLeave={() => {
            if (onHover) onHover(null);
          }}
          style={wrapperStyle}
        >
          <label style={labelStyle}>{labelText}</label>
          <BuilderDropdown
            properties={node.properties}
            value={val as string}
            onChange={(v) => handleChange(fieldPath, v)}
            editable
          />
          {errors[fieldPath] && (
            <div style={{ color: "#c53030", fontSize: 12 }}>
              {errors[fieldPath]}
            </div>
          )}
        </div>
      );
    }

    // BUTTON: submit-like behavior
    if (childType === "button") {
      const isSelected = selectedId === node.id;
      const isHoveredLocal = hoveredId === node.id;
      const wrapperStyle: React.CSSProperties = {
        marginTop: 8,
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        border: isSelected
          ? "2px solid #2563eb"
          : isHoveredLocal
          ? "1px dashed #9ca3af"
          : "1px solid transparent",
        backgroundColor: isSelected
          ? "#e6f0ff"
          : isHoveredLocal
          ? "#fbfdff"
          : undefined,
        display: "inline-block",
      };
      return (
        <div
          key={node.id}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(node.id);
          }}
          onMouseOver={(e) => {
            e.stopPropagation();
            if (onHover) onHover(node.id);
          }}
          onMouseLeave={() => {
            if (onHover) onHover(null);
          }}
          style={wrapperStyle}
        >
          <BuilderButton
            properties={node.properties}
            onClick={() => handleSubmit()}
          />
        </div>
      );
    }

    // Everything else: delegate to shared renderer which supports recursion and data-binding
    return (
      <RenderComponent
        key={node.id}
        component={node}
        selectedId={selectedId || null}
        hoveredId={hoveredId || null}
        onSelect={(id) => onSelect && onSelect(id)}
        onHover={(id) => onHover && onHover(id)}
        onAddComponent={(t, p, i) =>
          onAddComponent ? onAddComponent(t, p, i) : undefined
        }
        // pass through multi-select and move handlers if provided (RenderComponent will accept them)
        selectedIds={undefined}
        onMoveComponents={undefined}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 12 }}>
      {childrenComponents.map((child) => (
        // Each child rendered via renderNode; keys handled inside renderNode
        <React.Fragment key={child.id}>{renderNode(child)}</React.Fragment>
      ))}
    </form>
  );
};

export default BuilderForm;
