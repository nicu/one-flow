import React, { useState } from "react";
import type {
  DataModel,
  DataField,
  DataRelationship,
} from "../store/dataStore";
import { v4 as uuidv4 } from "uuid";

interface Props {
  models: DataModel[];
  relationships?: DataRelationship[];
  onChange: (models: DataModel[]) => void;
  onChangeRelationships?: (rels: DataRelationship[]) => void;
}

const defaultField = () =>
  ({ id: uuidv4(), name: "field", type: "string" } as DataField);

const EntitiesSidebar: React.FC<Props> = ({
  models,
  relationships,
  onChange,
  onChangeRelationships,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const addEntity = () => {
    const name = window.prompt("Entity name") || `Entity ${models.length + 1}`;
    const id = name.toLowerCase().replace(/\s+/g, "-") || uuidv4();
    const next = [...models, { id, name, fields: [defaultField()] }];
    onChange(next);
  };

  const removeEntity = (id: string) => {
    if (!window.confirm("Delete entity?")) return;
    onChange(models.filter((m) => m.id !== id));
  };

  const updateEntity = (id: string, patch: Partial<DataModel>) => {
    onChange(models.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addField = (modelId: string) => {
    const next = models.map((m) => {
      if (m.id !== modelId) return m;
      return { ...m, fields: [...m.fields, defaultField()] };
    });
    onChange(next);
  };

  const updateField = (
    modelId: string,
    fieldId: string,
    patch: Partial<DataField>
  ) => {
    onChange(
      models.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          fields: m.fields.map((f) =>
            f.id === fieldId ? { ...f, ...patch } : f
          ),
        };
      })
    );
  };

  const removeField = (modelId: string, fieldId: string) => {
    onChange(
      models.map((m) => {
        if (m.id !== modelId) return m;
        return { ...m, fields: m.fields.filter((f) => f.id !== fieldId) };
      })
    );
  };

  const exportJSON = () => {
    const payload: any = { models };
    if (relationships) payload.relationships = relationships;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entities.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Relationships helpers
  const [showRelForm, setShowRelForm] = useState(false);
  const [newRel, setNewRel] = useState<{
    from?: string;
    to?: string;
    type?: DataRelationship["type"];
  }>({
    from: undefined,
    to: undefined,
    type: "one-to-many",
  });

  const addRelationship = () => {
    if (!newRel.from || !newRel.to)
      return window.alert("Select from and to models");
    const id = `${newRel.from}-${newRel.to}-${Date.now()}`;
    const next = [
      ...(relationships || []),
      {
        id,
        fromModelId: newRel.from as string,
        toModelId: newRel.to as string,
        type: newRel.type as any,
      },
    ];
    onChangeRelationships?.(next);
    setShowRelForm(false);
    setNewRel({ from: undefined, to: undefined, type: "one-to-many" });
  };

  const removeRelationship = (id: string) => {
    if (!window.confirm("Delete relationship?")) return;
    onChangeRelationships?.((relationships || []).filter((r) => r.id !== id));
  };

  return (
    <div
      style={{
        padding: 12,
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <strong>Entities</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-outlined"
            onClick={exportJSON}
            style={{ padding: "6px 8px" }}
          >
            Export JSON
          </button>
          <button
            className="btn-primary"
            onClick={addEntity}
            style={{ padding: "6px 8px" }}
          >
            + Add
          </button>
        </div>
      </div>

      {models.map((m) => (
        <div
          key={m.id}
          style={{
            marginBottom: 10,
            border: "1px solid #eee",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              padding: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => toggle(m.id)}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{m.id}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = window.prompt("Rename entity", m.name);
                  if (newName) updateEntity(m.id, { name: newName });
                }}
              >
                Rename
              </button>
              <button
                className="btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntity(m.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {expanded[m.id] && (
            <div style={{ padding: 8, borderTop: "1px solid #f0f0f0" }}>
              {m.fields.map((f) => (
                <div
                  key={f.id}
                  className="property-field"
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "none" }}>Field</label>
                    <input
                      value={f.name}
                      onChange={(e) =>
                        updateField(m.id, f.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ width: 120 }}>
                    <select
                      className="example-select"
                      value={f.type}
                      onChange={(e) =>
                        updateField(m.id, f.id, { type: e.target.value as any })
                      }
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="array">array</option>
                      <option value="object">object</option>
                    </select>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => removeField(m.id, f.id)}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 8 }}>
                <button className="btn-outlined" onClick={() => addField(m.id)}>
                  + Add field
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: "8px 0", fontSize: 13 }}>Relationships</h4>
        {(relationships || []).map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 6,
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              marginBottom: 6,
            }}
          >
            <div style={{ fontSize: 13 }}>
              {r.fromModelId} → {r.toModelId}{" "}
              <span style={{ color: "#666", fontSize: 12 }}>({r.type})</span>
            </div>
            <div>
              <button
                className="btn-ghost"
                onClick={() => removeRelationship(r.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {showRelForm ? (
          <div
            style={{
              padding: 8,
              border: "1px dashed #e5e5e5",
              borderRadius: 6,
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select
                className="example-select"
                value={newRel.from || ""}
                onChange={(e) =>
                  setNewRel((s) => ({ ...s, from: e.target.value }))
                }
              >
                <option value="">From model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                className="example-select"
                value={newRel.to || ""}
                onChange={(e) =>
                  setNewRel((s) => ({ ...s, to: e.target.value }))
                }
              >
                <option value="">To model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                className="example-select"
                value={newRel.type}
                onChange={(e) =>
                  setNewRel((s) => ({ ...s, type: e.target.value as any }))
                }
              >
                <option value="one-to-many">one-to-many</option>
                <option value="many-to-one">many-to-one</option>
                <option value="many-to-many">many-to-many</option>
              </select>
              <button className="btn-primary" onClick={addRelationship}>
                Add
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowRelForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <button
              className="btn-outlined"
              onClick={() => setShowRelForm(true)}
            >
              + Add relationship
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntitiesSidebar;
