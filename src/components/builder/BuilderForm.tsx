import React, { useState, useEffect } from "react";
import type {
  ComponentProperties,
  BuilderComponent,
  ComponentType,
} from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { BuilderInput } from "./BuilderInput";
import { BuilderDropdown } from "./BuilderDropdown";
import { BuilderButton } from "./BuilderButton";

interface Props {
  properties: ComponentProperties;
  childrenComponents?: BuilderComponent[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  onAddComponent?: (type: ComponentType, parentId?: string) => void;
}

// Helpers to get/set nested paths like 'name.first'
const getValueAtPath = (obj: any, path?: string) => {
  if (!path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

const setValueAtPath = (obj: any, path: string, value: any) => {
  const parts = path.split(".");
  const last = parts.pop() as string;
  let cur = obj;
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
      setValues(JSON.parse(JSON.stringify(data[0])));
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
        // duplicate check: if value equals forbiddenValue, return error
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

  // Render a form using the styled builder inputs/dropdowns so the look
  // matches the rest of the builder. Pass editable/value/onChange so
  // controls are interactive at runtime.
  return (
    <form onSubmit={handleSubmit} style={{ padding: 12 }}>
      {childrenComponents.map((child) => {
        if (child.type === "input") {
          const fieldPath = child.properties?.dataBinding?.fieldId || "";
          const label = (child.properties as any).label || fieldPath;
          const validations = (child.properties as any).validations || [];
          const isRequired = validations.some(
            (v: any) => v.type === "required"
          );
          const labelText = label + (isRequired ? " *" : "");
          const val = getValueAtPath(values, fieldPath) ?? "";
          const isSelected = selectedId === child.id;
          const isHoveredLocal = hoveredId === child.id;
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
              key={child.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(child.id);
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                onHover && onHover(child.id);
              }}
              onMouseLeave={() => {
                onHover && onHover(null);
              }}
              style={wrapperStyle}
            >
              <label style={labelStyle}>{labelText}</label>
              <BuilderInput
                properties={child.properties}
                value={val}
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

        if (child.type === "dropdown") {
          const fieldPath = child.properties?.dataBinding?.fieldId || "";
          const label = (child.properties as any).label || fieldPath;
          const validations = (child.properties as any).validations || [];
          const isRequired = validations.some(
            (v: any) => v.type === "required"
          );
          const labelText = label + (isRequired ? " *" : "");
          const val = getValueAtPath(values, fieldPath) ?? "";
          const isSelected = selectedId === child.id;
          const isHoveredLocal = hoveredId === child.id;
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
              key={child.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(child.id);
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                onHover && onHover(child.id);
              }}
              onMouseLeave={() => {
                onHover && onHover(null);
              }}
              style={wrapperStyle}
            >
              <label style={labelStyle}>{labelText}</label>
              <BuilderDropdown
                properties={child.properties}
                value={val}
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

        if (child.type === "text") {
          const isSelected = selectedId === child.id;
          const isHoveredLocal = hoveredId === child.id;
          const wrapperStyle: React.CSSProperties = {
            marginBottom: 8,
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
            fontWeight: isSelected ? 700 : 400,
          };
          return (
            <div
              key={child.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(child.id);
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                onHover && onHover(child.id);
              }}
              onMouseLeave={() => {
                onHover && onHover(null);
              }}
              style={wrapperStyle}
            >
              <div style={labelStyle}>{child.properties?.text}</div>
            </div>
          );
        }

        if (child.type === "button") {
          const isSelected = selectedId === child.id;
          const isHoveredLocal = hoveredId === child.id;
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
              key={child.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(child.id);
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                onHover && onHover(child.id);
              }}
              onMouseLeave={() => {
                onHover && onHover(null);
              }}
              style={wrapperStyle}
            >
              <BuilderButton
                properties={child.properties}
                onClick={() => handleSubmit()}
              />
            </div>
          );
        }

        return (
          <div key={child.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              Unsupported child: {child.type}
            </div>
          </div>
        );
      })}
    </form>
  );
};

export default BuilderForm;
