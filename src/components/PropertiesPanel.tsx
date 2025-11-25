import React, { useState } from "react";
import type {
  BuilderComponent,
  ComponentProperties,
  AlignmentType,
} from "../types";
import type { DataStore } from "../store/dataStore";

interface PropertiesPanelProps {
  component: BuilderComponent | null;
  onUpdate: (properties: Partial<ComponentProperties>) => void;
  onDelete?: () => void;
  dataStore?: DataStore;
  onGenerateForm?: (modelId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  component,
  onUpdate,
  onDelete,
  dataStore,
  onGenerateForm,
}) => {
  const [selectedModelForForm, setSelectedModelForForm] = useState<string>("");
  if (!component) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <div className="no-selection">
          Select a component to edit its properties
        </div>
      </div>
    );
  }

  const { properties, type } = component;

  const renderStyleProperties = () => (
    <div className="property-group">
      <h4>Style</h4>
      <div className="property-field">
        <label>Border Radius</label>
        <input
          type="text"
          value={properties.borderRadius || ""}
          onChange={(e) => onUpdate({ borderRadius: e.target.value })}
          placeholder="4px"
        />
      </div>
      <div className="property-field">
        <label>Box Shadow</label>
        <input
          type="text"
          value={properties.boxShadow || ""}
          onChange={(e) => onUpdate({ boxShadow: e.target.value })}
          placeholder="none"
        />
      </div>
    </div>
  );

  const renderCommonProperties = () => (
    <>
      {renderStyleProperties()}
      <div className="property-group">
        <h4>Layout</h4>

        <div className="property-field">
          <label>Alignment</label>
          <select
            value={properties.alignment || "left"}
            onChange={(e) =>
              onUpdate({ alignment: e.target.value as AlignmentType })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="property-field">
          <label>Width</label>
          <input
            type="text"
            value={properties.width || ""}
            onChange={(e) => onUpdate({ width: e.target.value })}
            placeholder="auto"
          />
        </div>

        <div className="property-field">
          <label>Height</label>
          <input
            type="text"
            value={properties.height || ""}
            onChange={(e) => onUpdate({ height: e.target.value })}
            placeholder="auto"
          />
        </div>

        <div className="property-field">
          <label>Padding</label>
          <input
            type="text"
            value={properties.padding || ""}
            onChange={(e) => onUpdate({ padding: e.target.value })}
            placeholder="0px"
          />
        </div>

        <div className="property-field">
          <label>Margin</label>
          <input
            type="text"
            value={properties.margin || ""}
            onChange={(e) => onUpdate({ margin: e.target.value })}
            placeholder="0px"
          />
        </div>

        <div className="property-field">
          <label>Background Color</label>
          <input
            type="color"
            value={properties.backgroundColor || "#ffffff"}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          />
        </div>
      </div>
    </>
  );

  const renderTypeSpecificProperties = () => {
    switch (type) {
      case "text":
        return (
          <div className="property-group">
            <h4>Text</h4>
            <div className="property-field">
              <label>Content</label>
              <textarea
                value={properties.text || ""}
                onChange={(e) => onUpdate({ text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="property-field">
              <label>Font Size</label>
              <input
                type="text"
                value={properties.fontSize || ""}
                onChange={(e) => onUpdate({ fontSize: e.target.value })}
                placeholder="16px"
              />
            </div>
            <div className="property-field">
              <label>Color</label>
              <input
                type="color"
                value={properties.color || "#000000"}
                onChange={(e) => onUpdate({ color: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Font Weight</label>
              <select
                value={properties.fontWeight || "normal"}
                onChange={(e) => onUpdate({ fontWeight: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
              </select>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="property-group">
            <h4>Image</h4>
            <div className="property-field">
              <label>Source URL</label>
              <input
                type="text"
                value={properties.src || ""}
                onChange={(e) => onUpdate({ src: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="property-field">
              <label>Alt Text</label>
              <input
                type="text"
                value={properties.alt || ""}
                onChange={(e) => onUpdate({ alt: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Object Fit</label>
              <select
                value={properties.objectFit || "fill"}
                onChange={(e) => onUpdate({ objectFit: e.target.value as any })}
              >
                <option value="fill">Fill</option>
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
              </select>
            </div>
          </div>
        );

      case "button":
        return (
          <div className="property-group">
            <h4>Button</h4>
            <div className="property-field">
              <label>Text</label>
              <input
                type="text"
                value={properties.buttonText || ""}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Background Color</label>
              <input
                type="color"
                value={properties.buttonColor || "#007bff"}
                onChange={(e) => onUpdate({ buttonColor: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Text Color</label>
              <input
                type="color"
                value={properties.buttonTextColor || "#ffffff"}
                onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
              />
            </div>
          </div>
        );

      case "input":
        return (
          <div className="property-group">
            <h4>Input</h4>
            <div className="property-field">
              <label>Label</label>
              <input
                type="text"
                value={(properties as any).label || ""}
                onChange={(e) =>
                  onUpdate({ ...(properties as any), label: e.target.value })
                }
                placeholder="Label text (e.g. First name)"
              />
            </div>
            <div className="property-field">
              <label>Type</label>
              <select
                value={properties.inputType || "text"}
                onChange={(e) => onUpdate({ inputType: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div className="property-field">
              <label>Placeholder</label>
              <input
                type="text"
                value={properties.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Validations</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={
                      !!(properties as any).validations?.find(
                        (v: any) => v.type === "required"
                      )
                    }
                    onChange={(e) => {
                      const prev = (properties as any).validations || [];
                      const has = prev.find((v: any) => v.type === "required");
                      let next = prev.slice();
                      if (e.target.checked && !has)
                        next.push({ type: "required" });
                      if (!e.target.checked && has)
                        next = next.filter((v: any) => v.type !== "required");
                      onUpdate({ validations: next });
                    }}
                  />
                  Required
                </label>

                {/* <div style={{ display: "flex", gap: 8 }}>
                  <label
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!(properties as any).validations?.find(
                          (v: any) => v.type === "duplicate"
                        )
                      }
                      onChange={(e) => {
                        const prev = (properties as any).validations || [];
                        const has = prev.find(
                          (v: any) => v.type === "duplicate"
                        );
                        let next = prev.slice();
                        if (e.target.checked && !has)
                          next.push({
                            type: "duplicate",
                            forbiddenValue: "ONE",
                            message: "Can't be ONE",
                          });
                        if (!e.target.checked && has)
                          next = next.filter(
                            (v: any) => v.type !== "duplicate"
                          );
                        onUpdate({ validations: next });
                      }}
                    />
                    Duplicate check (forbidden = "ONE")
                  </label>
                </div> */}
              </div>
            </div>
          </div>
        );

      case "dropdown":
        return (
          <div className="property-group">
            <h4>Dropdown</h4>
            <div className="property-field">
              <label>Options (one per line)</label>
              <textarea
                value={(properties.options || []).join("\n")}
                onChange={(e) =>
                  onUpdate({ options: e.target.value.split("\n") })
                }
                rows={5}
              />
            </div>
          </div>
        );

      case "flex":
      case "row":
      case "column":
        return (
          <div className="property-group">
            <h4>Flex Layout</h4>
            <div className="property-field">
              <label>Direction</label>
              <select
                value={properties.flexDirection || "row"}
                onChange={(e) =>
                  onUpdate({
                    flexDirection: e.target.value as "row" | "column",
                  })
                }
              >
                <option value="row">Row</option>
                <option value="column">Column</option>
              </select>
            </div>
            <div className="property-field">
              <label>Gap</label>
              <input
                type="text"
                value={properties.gap || ""}
                onChange={(e) => onUpdate({ gap: e.target.value })}
                placeholder="10px"
              />
            </div>
            <div className="property-field">
              <label>Justify Items</label>
              <select
                value={properties.justifyItems || "start"}
                onChange={(e) => onUpdate({ justifyItems: e.target.value })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div className="property-field">
              <label>Align Items</label>
              <select
                value={properties.alignItems || "stretch"}
                onChange={(e) => onUpdate({ alignItems: e.target.value })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div className="property-field">
              <label>Justify Content</label>
              <select
                value={properties.justifyContent || "start"}
                onChange={(e) => onUpdate({ justifyContent: e.target.value })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div className="property-field">
              <label>Align Content</label>
              <select
                value={properties.alignContent || "start"}
                onChange={(e) => onUpdate({ alignContent: e.target.value })}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div className="property-field">
              <label>Justify Content</label>
              <select
                value={properties.justifyContent || "flex-start"}
                onChange={(e) => onUpdate({ justifyContent: e.target.value })}
              >
                <option value="flex-start">Start</option>
                <option value="center">Center</option>
                <option value="flex-end">End</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
              </select>
            </div>
            <div className="property-field">
              <label>Align Items</label>
              <select
                value={properties.alignItems || "stretch"}
                onChange={(e) => onUpdate({ alignItems: e.target.value })}
              >
                <option value="flex-start">Start</option>
                <option value="center">Center</option>
                <option value="flex-end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div className="property-field">
              <label>Wrap</label>
              <select
                value={properties.flexWrap || "nowrap"}
                onChange={(e) => onUpdate({ flexWrap: e.target.value as any })}
              >
                <option value="nowrap">No Wrap</option>
                <option value="wrap">Wrap</option>
                <option value="wrap-reverse">Wrap Reverse</option>
              </select>
            </div>
          </div>
        );

      case "form":
        return (
          <div className="property-group">
            <h4>Form</h4>
            <div className="property-field">
              <label>Generate Form From Model</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={selectedModelForForm || ""}
                  onChange={(e) => setSelectedModelForForm(e.target.value)}
                >
                  <option value="">Select model...</option>
                  {(dataStore?.models || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!selectedModelForForm}
                  onClick={() =>
                    onGenerateForm && onGenerateForm(selectedModelForForm)
                  }
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        );

        

      case "grid":
        return (
          <div className="property-group">
            <h4>Grid Layout</h4>
            <div className="property-field">
              <label>Columns (Fixed)</label>
              <input
                type="number"
                value={properties.gridColumns || 2}
                onChange={(e) =>
                  onUpdate({ gridColumns: parseInt(e.target.value) })
                }
                min="1"
              />
              <small style={{ fontSize: "10px", color: "#666" }}>
                Tip: If you also set a Min Column Width, responsive mode may
                override the fixed column count.
              </small>
            </div>
            <div className="property-field">
              <label>Min Column Width (Responsive)</label>
              <input
                type="text"
                value={properties.minColumnWidth || ""}
                onChange={(e) => onUpdate({ minColumnWidth: e.target.value })}
                placeholder="e.g. 250px"
              />
              <small style={{ fontSize: "10px", color: "#666" }}>
                Overrides fixed columns
              </small>
            </div>
            <div className="property-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!properties.useFixedColumns}
                  onChange={(e) =>
                    onUpdate({ useFixedColumns: e.target.checked })
                  }
                />
                Use Fixed Columns (ignore Min Column Width)
              </label>
              <small style={{ fontSize: "10px", color: "#666" }}>
                When enabled, the grid will use the fixed `Columns` count
                instead of responsive `Min Column Width`.
              </small>
            </div>
            <div className="property-field">
              <label>Rows</label>
              <input
                type="number"
                value={properties.gridRows || 2}
                onChange={(e) =>
                  onUpdate({ gridRows: parseInt(e.target.value) })
                }
                min="1"
              />
            </div>
            <div className="property-field">
              <label>Gap</label>
              <input
                type="text"
                value={properties.gap || ""}
                onChange={(e) => onUpdate({ gap: e.target.value })}
                placeholder="10px"
              />
            </div>
          </div>
        );

      case "datagrid":
        return (
          <div className="property-group">
            <h4>Data Grid</h4>
            <div className="property-field">
              <label>Columns (one per line as field:Header:width)</label>
              <textarea
                value={(properties.columns || [])
                  .map(
                    (c) =>
                      `${c.field}:${c.headerName || c.field}:${c.width || ""}`
                  )
                  .join("\n")}
                onChange={(e) => {
                  const lines = e.target.value.split(/\r?\n/).filter(Boolean);
                  const cols = lines.map((ln) => {
                    const parts = ln.split(":");
                    return {
                      field: parts[0].trim(),
                      headerName: (parts[1] || parts[0]).trim(),
                      width: parts[2] ? parseInt(parts[2], 10) : undefined,
                    };
                  });
                  onUpdate({ columns: cols });
                }}
                rows={6}
              />
            </div>

            <div className="property-field">
              <label>Page Size</label>
              <input
                type="number"
                value={properties.pageSize || 5}
                onChange={(e) =>
                  onUpdate({ pageSize: parseInt(e.target.value, 10) })
                }
                min={1}
              />
            </div>

            {dataStore && (
              <div className="property-field">
                <label>Auto-generate Columns From Model</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    onChange={(e) => {
                      const modelId = e.target.value;
                      const model = dataStore.models.find(
                        (m) => m.id === modelId
                      );
                      if (model) {
                        // If the selected model contains an array field
                        // (e.g. `search` with `results: array`), prefer to
                        // auto-generate columns from the array item's model
                        // so columns match the actual rows (the item type).
                        const arrayField = model.fields.find(
                          (f) => f.type === "array" && f.arrayItemType
                        );

                        if (arrayField) {
                          const itemModel = dataStore.models.find(
                            (m) => m.id === arrayField.arrayItemType
                          );
                          if (itemModel) {
                            const cols = itemModel.fields.map((f) => ({
                              field: f.id,
                              headerName: f.name,
                              width: 150,
                            }));
                            onUpdate({
                              columns: cols,
                              dataBinding: {
                                ...(properties.dataBinding || {}),
                                // Keep the collection bound to the selected
                                // (wrapper) model (e.g. `search`) so the
                                // dropdown still shows `search` as selected,
                                // but generate columns from the item model
                                // so they match the actual row objects.
                                collectionId: modelId,
                              },
                            });
                            return;
                          }
                        }

                        // Fallback: use the selected model's fields
                        const cols = model.fields.map((f) => ({
                          field: f.id,
                          headerName: f.name,
                          width: 150,
                        }));
                        onUpdate({
                          columns: cols,
                          dataBinding: {
                            ...(properties.dataBinding || {}),
                            collectionId: modelId,
                          },
                        });
                      }
                    }}
                    value={properties.dataBinding?.collectionId || ""}
                  >
                    <option value="">Select model...</option>
                    {dataStore.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="property-field">
              <label>Unwrap collection from wrapper model</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!properties.dataBinding?.unwrapResults}
                  onChange={(e) =>
                    onUpdate({
                      dataBinding: {
                        ...(properties.dataBinding || {}),
                        unwrapResults: e.target.checked,
                      },
                    })
                  }
                />
                <small style={{ color: "#666" }}>
                  When enabled, DataGrid will display the items inside array
                  fields (e.g. `search.results`). When disabled, the wrapper
                  objects are used as rows.
                </small>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDataBindingProperties = () => {
    if (!dataStore) return null;

    const { models, data } = dataStore;
    const currentBinding = properties.dataBinding;

    // For flex/grid/tab containers, show collection binding
    const canBindToCollection =
      type === "flex" || type === "grid" || type === "row" || type === "column" || type === "tabs";

    // For text/input/button/image/tabs, show field binding
    const canBindToField =
      type === "text" ||
      type === "input" ||
      type === "button" ||
      type === "image" ||
      type === "tabs";

    // For forms, allow binding to a model (the whole object)
    const canBindToModel = type === "form";

    if (!canBindToCollection && !canBindToField && !canBindToModel) return null;

    return (
      <div className="property-group">
        <h4>Data Binding</h4>

        {canBindToCollection && (
          <div className="property-field">
            <label>Bind to Collection</label>
            <select
              value={currentBinding?.collectionId || ""}
              onChange={(e) => {
                const collectionId = e.target.value || undefined;
                onUpdate({
                  dataBinding: {
                    ...currentBinding,
                    collectionId,
                    modelId: collectionId,
                  },
                });
              }}
            >
              <option value="">None</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({data[model.id]?.length || 0} items)
                </option>
              ))}
            </select>
          </div>
        )}

        {canBindToField && (
          <>
            <div className="property-field">
              <label>Bind to Model</label>
              <select
                value={currentBinding?.modelId || ""}
                onChange={(e) => {
                  const modelId = e.target.value || undefined;
                  onUpdate({
                    dataBinding: {
                      ...currentBinding,
                      modelId,
                      fieldId: undefined, // Reset field when model changes
                    },
                  });
                }}
              >
                <option value="">None</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {currentBinding?.modelId && (
              <div className="property-field">
                <label>Bind to Field</label>
                <select
                  value={currentBinding?.fieldId || ""}
                  onChange={(e) => {
                    const fieldId = e.target.value || undefined;
                    onUpdate({
                      dataBinding: {
                        ...currentBinding,
                        fieldId,
                      },
                    });
                  }}
                >
                  <option value="">None</option>
                  {models
                    .find((m) => m.id === currentBinding.modelId)
                    ?.fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </>
        )}
        {canBindToModel && (
          <div className="property-field">
            <label>Bind to Model</label>
            <select
              value={currentBinding?.modelId || ""}
              onChange={(e) => {
                const modelId = e.target.value || undefined;
                onUpdate({
                  dataBinding: {
                    ...(currentBinding || {}),
                    modelId,
                  },
                });
              }}
            >
              <option value="">None</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Properties</h3>
        <div className="component-type">{type}</div>
      </div>

      <div className="properties-content">
        {renderTypeSpecificProperties()}
        {renderCommonProperties()}
        {renderDataBindingProperties()}

        {onDelete && (
          <div className="property-group">
            <button className="delete-button" onClick={onDelete}>
              Delete Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
