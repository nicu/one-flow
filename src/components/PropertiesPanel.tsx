import React, { useState } from "react";
import {
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Square,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
} from "lucide-react";
import { useDataProviders } from "../contexts/DataProvidersContext";
import VisibilityExpressionModal from "./VisibilityExpressionModal";
import { useTranslation } from "react-i18next";
import { setTranslationForKey } from "../utils/i18nUtils";
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
  onBindToEnclosingProvider?: () => void;
}

// Small responsive field editor: single value or per-breakpoint values
const ResponsiveField: React.FC<{
  label: string;
  propName: string;
  value?: any;
  onUpdate: (v: any) => void;
  placeholder?: string;
}> = ({ label, propName, value, onUpdate, placeholder }) => {
  const isObject = value && typeof value === "object" && !Array.isArray(value);
  const [responsive, setResponsive] = useState<boolean>(!!isObject);

  const getSingle = () => {
    if (!value) return "";
    if (typeof value === "object") {
      // prefer desktop -> tablet -> mobile
      const pick = value.desktop ?? value.tablet ?? value.mobile ?? "";
      // If the picked value is itself an object, stringify it for display
      if (pick && typeof pick === "object") return JSON.stringify(pick);
      return String(pick ?? "");
    }
    return String(value);
  };

  const updateSingle = (v: string) => onUpdate({ [propName]: v });

  const updateResponsive = (next: Record<string, string>) =>
    // remove empty keys
    onUpdate({
      [propName]: Object.fromEntries(
        Object.entries(next).filter(([, val]) => val !== "")
      ),
    });

  const obj = isObject ? (value as Record<string, string>) : {};

  return (
    <div className="property-field">
      <label
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <label style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={responsive}
            onChange={(e) => {
              const next = e.target.checked;
              setResponsive(next);
              if (!next) {
                // collapse to single value (prefer desktop -> tablet -> mobile)
                const single =
                  value && typeof value === "object"
                    ? value.desktop ?? value.tablet ?? value.mobile ?? ""
                    : value || "";
                onUpdate({ [propName]: single });
              } else {
                // expand: set all breakpoints to current single value (use current single)
                const single = getSingle();
                onUpdate({
                  [propName]: {
                    mobile: single,
                    tablet: single,
                    desktop: single,
                  },
                });
              }
            }}
          />{" "}
          Responsive
        </label>
      </label>
      {!responsive ? (
        <input
          type="text"
          value={getSingle()}
          placeholder={placeholder}
          onChange={(e) => updateSingle(e.target.value)}
        />
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="mobile"
            value={obj.mobile || ""}
            onChange={(e) =>
              updateResponsive({
                mobile: e.target.value,
                tablet: obj.tablet || "",
                desktop: obj.desktop || "",
              })
            }
          />
          <input
            type="text"
            placeholder="tablet"
            value={obj.tablet || ""}
            onChange={(e) =>
              updateResponsive({
                mobile: obj.mobile || "",
                tablet: e.target.value,
                desktop: obj.desktop || "",
              })
            }
          />
          <input
            type="text"
            placeholder="desktop"
            value={obj.desktop || ""}
            onChange={(e) =>
              updateResponsive({
                mobile: obj.mobile || "",
                tablet: obj.tablet || "",
                desktop: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  component,
  onUpdate,
  onDelete,
  dataStore,
  onGenerateForm,
  onBindToEnclosingProvider,
}) => {
  const [selectedModelForForm, setSelectedModelForForm] = useState<string>("");
  // Ensure hooks order stability: call `useDataProviders` at the top level
  // so we don't conditionally call hooks inside nested render helpers.
  const dp = useDataProviders();
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
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

  const { properties = {} as ComponentProperties, type } = component;

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

        <ResponsiveField
          label="Width"
          propName="width"
          value={properties.width}
          onUpdate={(v) =>
            onUpdate(v.width ? { width: v.width } : { width: "" })
          }
          placeholder="auto"
        />

        <ResponsiveField
          label="Height"
          propName="height"
          value={properties.height}
          onUpdate={(v) =>
            onUpdate(v.height ? { height: v.height } : { height: "" })
          }
          placeholder="auto"
        />

        <ResponsiveField
          label="Padding"
          propName="padding"
          value={properties.padding}
          onUpdate={(v) =>
            onUpdate(v.padding ? { padding: v.padding } : { padding: "" })
          }
          placeholder="0px"
        />

        <div className="property-field">
          <label>Background Color</label>
          <input
            type="color"
            value={colorToHex(properties.backgroundColor, "#ffffff")}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          />
        </div>
        <ResponsiveField
          label="Margin"
          propName="margin"
          value={properties.margin}
          onUpdate={(v) =>
            onUpdate(v.margin ? { margin: v.margin } : { margin: "" })
          }
          placeholder="0px"
        />

        {/* Background color moved to type-specific color sections */}
      </div>
    </>
  );

  const renderTypeSpecificProperties = () => {
    switch (type) {
      case "lt-data-provider":
        return <LTDataProviderEditor />;

      case "lt-typography":
        return (
          <div className="property-group">
            <h4>Text</h4>
            <div className="property-field">
              <label>Content</label>
              <textarea
                value={
                  component?.id
                    ? t(`${component.id}.text`, properties.text || "")
                    : properties.text || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.text`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ text: val });
                }}
                rows={3}
              />
            </div>
            <div className="property-field">
              <label>Font Size</label>
              <ResponsiveField
                label="Font Size"
                propName="fontSize"
                value={properties.fontSize}
                onUpdate={(v) =>
                  onUpdate(
                    v.fontSize ? { fontSize: v.fontSize } : { fontSize: "" }
                  )
                }
                placeholder="16px"
              />
            </div>
            <div className="property-field">
              <label>Color</label>
              <input
                type="color"
                value={colorToHex(properties.color, "#000000")}
                onChange={(e) => onUpdate({ color: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Background Color</label>
              <input
                type="color"
                value={colorToHex(properties.backgroundColor, "#ffffff")}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Background Color</label>
              <input
                type="color"
                value={colorToHex(properties.backgroundColor, "#ffffff")}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
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

      case "text":
        return (
          <div className="property-group">
            <h4>Text</h4>
            <div className="property-field">
              <label>Content</label>
              <textarea
                value={
                  component?.id
                    ? t(`${component.id}.text`, properties.text || "")
                    : properties.text || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.text`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ text: val });
                }}
                rows={3}
              />
            </div>
            <div className="property-field">
              <label>Font Size</label>
              <ResponsiveField
                label="Font Size"
                propName="fontSize"
                value={properties.fontSize}
                onUpdate={(v) =>
                  onUpdate(
                    v.fontSize ? { fontSize: v.fontSize } : { fontSize: "" }
                  )
                }
                placeholder="16px"
              />
            </div>
            <div className="property-field">
              <label>Color</label>
              <input
                type="color"
                value={colorToHex(properties.color, "#000000")}
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.alt`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ alt: val });
                }}
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
                value={
                  component?.id
                    ? t(
                        `${component.id}.buttonText`,
                        properties.buttonText || ""
                      )
                    : properties.buttonText || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.buttonText`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ buttonText: val });
                }}
              />
            </div>
            <div className="property-field">
              <label>Background Color</label>
              <input
                type="color"
                value={colorToHex(properties.buttonColor, "#007bff")}
                onChange={(e) => onUpdate({ buttonColor: e.target.value })}
              />
            </div>
            <div className="property-field">
              <label>Text Color</label>
              <input
                type="color"
                value={colorToHex(properties.buttonTextColor, "#ffffff")}
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
                value={
                  component?.id
                    ? t(
                        `${component.id}.label`,
                        (properties as any).label || ""
                      )
                    : (properties as any).label || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.label`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ ...(properties as any), label: val });
                }}
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
                value={
                  component?.id
                    ? t(
                        `${component.id}.placeholder`,
                        properties.placeholder || ""
                      )
                    : properties.placeholder || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (component?.id) {
                    setTranslationForKey(
                      `${component.id}.placeholder`,
                      val,
                      i18n.language
                    );
                  }
                  onUpdate({ placeholder: val });
                }}
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
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Columns</span>
                <small style={{ fontSize: 12, color: "#666" }}>
                  Responsive
                </small>
              </label>
              {/* Responsive columns editor: single number or per-breakpoint numbers */}
              {(() => {
                const value = properties.gridColumns;
                const isObj =
                  value && typeof value === "object" && !Array.isArray(value);
                const singleVal = isObj
                  ? value.desktop ?? value.tablet ?? value.mobile ?? ""
                  : value ?? "";
                return (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {!isObj ? (
                      <input
                        type="number"
                        value={singleVal}
                        onChange={(e) =>
                          onUpdate({
                            gridColumns: parseInt(e.target.value) || 0,
                          })
                        }
                        min={1}
                      />
                    ) : (
                      <>
                        <input
                          type="number"
                          placeholder="mobile"
                          value={(value as any).mobile ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridColumns: {
                                mobile: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                                tablet: (value as any).tablet || undefined,
                                desktop: (value as any).desktop || undefined,
                              },
                            })
                          }
                          min={1}
                        />
                        <input
                          type="number"
                          placeholder="tablet"
                          value={(value as any).tablet ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridColumns: {
                                mobile: (value as any).mobile || undefined,
                                tablet: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                                desktop: (value as any).desktop || undefined,
                              },
                            })
                          }
                          min={1}
                        />
                        <input
                          type="number"
                          placeholder="desktop"
                          value={(value as any).desktop ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridColumns: {
                                mobile: (value as any).mobile || undefined,
                                tablet: (value as any).tablet || undefined,
                                desktop: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          min={1}
                        />
                      </>
                    )}
                    <label style={{ fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={!!isObj}
                        onChange={(e) => {
                          const next = e.target.checked;
                          if (!next) {
                            // collapse to single: prefer desktop -> tablet -> mobile
                            const single = isObj
                              ? value.desktop ??
                                value.tablet ??
                                value.mobile ??
                                ""
                              : value || "";
                            onUpdate({
                              gridColumns: single
                                ? parseInt(single as any)
                                : undefined,
                            });
                          } else {
                            // expand: set all breakpoints to current single value
                            const base = singleVal || 1;
                            onUpdate({
                              gridColumns: {
                                mobile: parseInt(base as any) || 1,
                                tablet: parseInt(base as any) || 1,
                                desktop: parseInt(base as any) || 1,
                              },
                            });
                          }
                        }}
                      />
                      Responsive
                    </label>
                  </div>
                );
              })()}
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
              {(() => {
                const value = properties.gridRows;
                const isObj =
                  value && typeof value === "object" && !Array.isArray(value);
                const singleVal = isObj
                  ? value.desktop ?? value.tablet ?? value.mobile ?? ""
                  : value ?? "";
                return (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {!isObj ? (
                      <input
                        type="number"
                        value={singleVal}
                        onChange={(e) =>
                          onUpdate({ gridRows: parseInt(e.target.value) || 0 })
                        }
                        min={1}
                      />
                    ) : (
                      <>
                        <input
                          type="number"
                          placeholder="mobile"
                          value={(value as any).mobile ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridRows: {
                                mobile: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                                tablet: (value as any).tablet || undefined,
                                desktop: (value as any).desktop || undefined,
                              },
                            })
                          }
                          min={1}
                        />
                        <input
                          type="number"
                          placeholder="tablet"
                          value={(value as any).tablet ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridRows: {
                                mobile: (value as any).mobile || undefined,
                                tablet: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                                desktop: (value as any).desktop || undefined,
                              },
                            })
                          }
                          min={1}
                        />
                        <input
                          type="number"
                          placeholder="desktop"
                          value={(value as any).desktop ?? ""}
                          onChange={(e) =>
                            onUpdate({
                              gridRows: {
                                mobile: (value as any).mobile || undefined,
                                tablet: (value as any).tablet || undefined,
                                desktop: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          min={1}
                        />
                      </>
                    )}
                    <label style={{ fontSize: 12 }}>
                      <input
                        type="checkbox"
                        checked={!!isObj}
                        onChange={(e) => {
                          const next = e.target.checked;
                          if (!next) {
                            const single = isObj
                              ? value.desktop ??
                                value.tablet ??
                                value.mobile ??
                                ""
                              : value || "";
                            onUpdate({
                              gridRows: single
                                ? parseInt(single as any)
                                : undefined,
                            });
                          } else {
                            const base = singleVal || 1;
                            onUpdate({
                              gridRows: {
                                mobile: parseInt(base as any) || 1,
                                tablet: parseInt(base as any) || 1,
                                desktop: parseInt(base as any) || 1,
                              },
                            });
                          }
                        }}
                      />
                      Responsive
                    </label>
                  </div>
                );
              })()}
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

      case "image-grid":
        return (
          <div className="property-group">
            <h4>Image Grid</h4>
            <div className="property-field">
              <label>Title</label>
              <input
                type="text"
                value={(properties as any).title || ""}
                onChange={(e) =>
                  onUpdate({ ...(properties as any), title: e.target.value })
                }
              />
            </div>

            <div className="property-field">
              <label>Title Variant</label>
              <select
                value={(properties as any).titleVariant || "h2"}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    titleVariant: e.target.value,
                  })
                }
              >
                <option value="h1">h1</option>
                <option value="h2">h2</option>
                <option value="h3">h3</option>
                <option value="h4">h4</option>
                <option value="h5">h5</option>
                <option value="h6">h6</option>
              </select>
            </div>

            {(() => {
              // Build merged models list (app dataStore + provider models)
              const providerModels = Object.values(dp.models || {}).map(
                (m) => ({
                  id: m.id,
                  name: m.name,
                  fields: Object.keys(m.fields).map((f) => ({
                    id: f,
                    name: f,
                    type: m.fields[f],
                  })),
                })
              );
              const rawModels = [
                ...(dataStore?.models || []),
                ...providerModels,
              ];
              const modelMap: Map<string, any> = new Map();
              for (const m of rawModels) {
                if (!modelMap.has(m.id)) modelMap.set(m.id, m);
              }
              const models = Array.from(modelMap.values());

              const boundCollectionId =
                (properties.dataBinding &&
                  properties.dataBinding.collectionId) ||
                undefined;
              const boundModel = models.find((m) => m.id === boundCollectionId);

              if (boundModel) {
                return (
                  <>
                    <div className="property-field">
                      <label>Image Title Field</label>
                      <select
                        value={(properties as any).itemTitleField || ""}
                        onChange={(e) =>
                          onUpdate({
                            ...(properties as any),
                            itemTitleField: e.target.value,
                          })
                        }
                      >
                        <option value="">(select field)</option>
                        {boundModel.fields.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="property-field">
                      <label>Image Source Field</label>
                      <select
                        value={(properties as any).itemImageField || ""}
                        onChange={(e) =>
                          onUpdate({
                            ...(properties as any),
                            itemImageField: e.target.value,
                          })
                        }
                      >
                        <option value="">(select field)</option>
                        {boundModel.fields.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                );
              }

              // Fallback to free text inputs when no collection is bound
              return (
                <>
                  <div className="property-field">
                    <label>Image Title Field</label>
                    <input
                      type="text"
                      value={(properties as any).itemTitleField || ""}
                      onChange={(e) =>
                        onUpdate({
                          ...(properties as any),
                          itemTitleField: e.target.value,
                        })
                      }
                      placeholder="e.g. title"
                    />
                  </div>

                  <div className="property-field">
                    <label>Image Source Field</label>
                    <input
                      type="text"
                      value={(properties as any).itemImageField || ""}
                      onChange={(e) =>
                        onUpdate({
                          ...(properties as any),
                          itemImageField: e.target.value,
                        })
                      }
                      placeholder="e.g. imageUrl"
                    />
                  </div>
                </>
              );
            })()}

            <div className="property-field">
              <label>Image Title Position</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 6,
                }}
              >
                {(() => {
                  const iconMap: Record<string, React.ReactNode> = {
                    "top-left": <ArrowUpLeft size={16} />,
                    "top-center": <ArrowUp size={16} />,
                    "top-right": <ArrowUpRight size={16} />,
                    "center-left": <ArrowLeft size={16} />,
                    "center-center": <Square size={14} />,
                    "center-right": <ArrowRight size={16} />,
                    "bottom-left": <ArrowDownLeft size={16} />,
                    "bottom-center": <ArrowDown size={16} />,
                    "bottom-right": <ArrowDownRight size={16} />,
                  };

                  return [
                    ["top-left", "top-center", "top-right"],
                    ["center-left", "center-center", "center-right"],
                    ["bottom-left", "bottom-center", "bottom-right"],
                  ].map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      {row.map((pos) => (
                        <button
                          key={pos}
                          onClick={() =>
                            onUpdate({
                              ...(properties as any),
                              imagePosition: pos,
                            })
                          }
                          className={`pos-btn ${
                            ((properties as any).imagePosition ||
                              "center-center") === pos
                              ? "active"
                              : ""
                          }`}
                          style={{
                            padding: 8,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          aria-label={`Set position ${pos}`}
                          title={pos}
                        >
                          {iconMap[pos]}
                        </button>
                      ))}
                    </React.Fragment>
                  ));
                })()}
              </div>
            </div>
          </div>
        );

      case "lazy-user-list":
        return (
          <div className="property-group">
            <h4>Lazy User List</h4>
            <div className="property-field">
              <label>Title</label>
              <input
                type="text"
                value={(properties as any).title || ""}
                onChange={(e) =>
                  onUpdate({ ...(properties as any), title: e.target.value })
                }
              />
            </div>

            <div className="property-field">
              <label>Count</label>
              <input
                type="number"
                value={(properties as any).count ?? 12}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    count: parseInt(e.target.value, 10) || 0,
                  })
                }
                min={1}
              />
            </div>

            <div className="property-field">
              <label>Animation</label>
              <select
                value={(properties as any).animation || "none"}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    animation: e.target.value,
                  })
                }
              >
                <option value="none">None</option>
                <option value="debug">Debug</option>
                <option value="fade">Fade (in)</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="scale-in">Scale In</option>
                <option value="scale-out">Scale Out</option>
              </select>
            </div>

            <div className="property-field">
              <label>Enter Duration (ms)</label>
              <input
                type="number"
                value={(properties as any).enterDuration ?? 400}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    enterDuration: parseInt(e.target.value, 10) || 0,
                  })
                }
                min={0}
              />
            </div>

            <div className="property-field">
              <label>Intersection Threshold (0-1)</label>
              <input
                type="number"
                step={0.05}
                min={0}
                max={1}
                value={(properties as any).intersectionThreshold ?? 0.1}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    intersectionThreshold: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="property-field">
              <label>Intersection Root Margin</label>
              <input
                type="text"
                value={(properties as any).intersectionRootMargin || "200px"}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    intersectionRootMargin: e.target.value,
                  })
                }
                placeholder="200px"
              />
            </div>

            <div className="property-field">
              <label>Exit Duration (ms)</label>
              <input
                type="number"
                value={(properties as any).exitDuration ?? 300}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    exitDuration: parseInt(e.target.value, 10) || 0,
                  })
                }
                min={0}
              />
            </div>

            <div className="property-field">
              <label>Item Class Name</label>
              <input
                type="text"
                value={(properties as any).itemClassName || ""}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    itemClassName: e.target.value,
                  })
                }
              />
            </div>

            <div className="property-field">
              <label>Image Class Name</label>
              <input
                type="text"
                value={(properties as any).imageClassName || ""}
                onChange={(e) =>
                  onUpdate({
                    ...(properties as any),
                    imageClassName: e.target.value,
                  })
                }
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
    // Merge global dataStore (app) models with DataProviders models (editor)
    const providerModels = Object.values(dp.models || {}).map((m) => ({
      id: m.id,
      name: m.name,
      fields: Object.keys(m.fields).map((f) => ({
        id: f,
        name: f,
        type: m.fields[f],
      })),
    }));

    // Merge and deduplicate models by id to avoid duplicate <option> keys
    const rawModels = [...(dataStore?.models || []), ...providerModels];
    const modelMap: Map<string, any> = new Map();
    for (const m of rawModels) {
      if (!modelMap.has(m.id)) modelMap.set(m.id, m);
    }
    const models = Array.from(modelMap.values());
    const data = { ...(dataStore?.data || {}) } as Record<string, any[]>;
    for (const m of Object.values(dp.models || {})) data[m.id] = m.items || [];
    const currentBinding = properties.dataBinding;

    // For flex/grid/tab containers, show collection binding
    const canBindToCollection =
      type === "flex" ||
      type === "grid" ||
      type === "row" ||
      type === "column" ||
      type === "tabs";
    // allow Image Grid to bind to collections as well
    const canBindToCollectionExtended =
      canBindToCollection || type === "image-grid" || type === "lazy-user-list";

    // For text/input/button/image/tabs, show field binding
    const canBindToField = [
      "text",
      "input",
      "button",
      "image",
      "tabs",
      // LT-prefixed equivalents
      "lt-typography",
      "lt-input",
      "lt-button",
      "lt-image",
    ].includes(type as string);

    // For forms, allow binding to a model (the whole object)
    const canBindToModel = type === "form";

    if (!canBindToCollectionExtended && !canBindToField && !canBindToModel)
      return null;

    return (
      <div className="property-group">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ margin: 0 }}>Data Binding</h4>
          {onBindToEnclosingProvider && component && (
            <button
              className="btn-ghost"
              onClick={() => onBindToEnclosingProvider()}
              title="Bind this component to the nearest enclosing LT Data Provider"
              style={{ fontSize: 12, padding: "6px 8px" }}
            >
              Bind to enclosing provider
            </button>
          )}
        </div>

        {canBindToCollectionExtended && (
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
                    ?.fields.map(
                      (field: { id: string; name: string; type: string }) => (
                        <option key={field.id} value={field.id}>
                          {field.name} ({field.type})
                        </option>
                      )
                    )}
                </select>
              </div>
            )}
            {currentBinding?.modelId && (
              <div className="property-field">
                <label>Pick Item</label>
                <select
                  value={
                    typeof currentBinding?.itemIndex === "number"
                      ? String(currentBinding?.itemIndex)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextIndex =
                      val === "" ? undefined : parseInt(val, 10);
                    onUpdate({
                      dataBinding: {
                        ...(currentBinding || {}),
                        itemIndex: nextIndex,
                      },
                    });
                  }}
                >
                  <option value="">(auto - first)</option>
                  {((data[currentBinding.modelId] as any[]) || []).map(
                    (it: any, idx: number) => {
                      const label =
                        (it && (it.name || it.title || it.id)) || `#${idx}`;
                      return (
                        <option key={idx} value={String(idx)}>
                          {label}
                        </option>
                      );
                    }
                  )}
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

  // Inline editor for LT Data Provider components
  const LTDataProviderEditor: React.FC = () => {
    const models = Object.values(dp.models || {});
    const currentProviderId = (properties as any)?.providerId || "";

    const [editingModelId, setEditingModelId] = useState<string>(
      currentProviderId || ""
    );
    const [newModelId, setNewModelId] = useState("");
    const [newModelName, setNewModelName] = useState("");
    const [itemsJson, setItemsJson] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Sync itemsJson when editingModelId changes
    React.useEffect(() => {
      if (editingModelId) {
        const m = dp.models[editingModelId];
        setItemsJson(m ? JSON.stringify(m.items || [], null, 2) : "");
        setNewModelName(m ? m.name : "");
      } else {
        setItemsJson("");
        setNewModelName("");
      }
    }, [editingModelId]);

    const handleSelectProvider = (id: string) => {
      onUpdate({ ...(properties as any), providerId: id });
    };

    const handleAddModel = () => {
      if (!newModelId) return setError("Model id is required");
      let items = [] as any[];
      try {
        items = newModelId && itemsJson ? JSON.parse(itemsJson) : [];
      } catch (e) {
        return setError("Invalid JSON for items");
      }
      dp.addModel({
        id: newModelId,
        name: newModelName || newModelId,
        fields: {},
        items,
      });
      setNewModelId("");
      setNewModelName("");
      setItemsJson("");
      setError(null);
    };

    const handleSaveModel = () => {
      if (!editingModelId) return;
      try {
        const parsed = itemsJson ? JSON.parse(itemsJson) : [];
        dp.updateModel(editingModelId, { name: newModelName, items: parsed });
        setError(null);
      } catch (e) {
        setError("Invalid JSON for items");
      }
    };

    const handleRemoveModel = (id: string) => {
      if (!confirm(`Delete model ${id}?`)) return;
      dp.removeModel(id);
      if (currentProviderId === id)
        onUpdate({ ...(properties as any), providerId: undefined });
      setEditingModelId("");
    };

    return (
      <div className="property-group">
        <h4>Data Provider</h4>
        <div className="property-field">
          <label>Provider Model</label>
          <select
            value={currentProviderId || ""}
            onChange={(e) => handleSelectProvider(e.target.value)}
          >
            <option value="">(none)</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Edit models</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <select
              value={editingModelId}
              onChange={(e) => setEditingModelId(e.target.value)}
            >
              <option value="">Select model to edit...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setEditingModelId("");
                setNewModelId("");
                setNewModelName("");
                setItemsJson("");
              }}
            >
              Clear
            </button>
          </div>

          {editingModelId ? (
            <div style={{ marginTop: 8 }}>
              <div className="property-field">
                <label>Model Name</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                />
              </div>
              <div className="property-field">
                <label>Items (JSON array)</label>
                <textarea
                  rows={6}
                  value={itemsJson}
                  onChange={(e) => setItemsJson(e.target.value)}
                />
              </div>
              {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-primary" onClick={handleSaveModel}>
                  Save
                </button>
                <button onClick={() => handleRemoveModel(editingModelId)}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "#666" }}>
                Create new model
              </div>
              <div className="property-field">
                <label>Model ID</label>
                <input
                  type="text"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  placeholder="slug-id"
                />
              </div>
              <div className="property-field">
                <label>Model Name</label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Friendly name"
                />
              </div>
              <div className="property-field">
                <label>Items (JSON array)</label>
                <textarea
                  rows={6}
                  value={itemsJson}
                  onChange={(e) => setItemsJson(e.target.value)}
                  placeholder='[ { "id": "1", "name": "Alice" } ]'
                />
              </div>
              {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-primary" onClick={handleAddModel}>
                  Add Model
                </button>
              </div>
            </div>
          )}
        </div>
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

        {/* Visibility: placed directly above Data Binding per request */}
        <div className="property-group">
          <h4>Visibility</h4>
          <div
            className="property-field"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={properties.visible !== false}
                onChange={(e) => onUpdate({ visible: e.target.checked })}
              />
              Visible
            </label>

            <button
              onClick={() => setIsVisibilityModalOpen(true)}
              className="btn-ghost"
            >
              Link
            </button>

            {properties.visibilityExpression && (
              <div style={{ fontSize: 12, color: "#666" }}>
                Bound to: <strong>{properties.visibilityExpression}</strong>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => onUpdate({ visibilityExpression: undefined })}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        <VisibilityExpressionModal
          isOpen={isVisibilityModalOpen}
          currentExpression={properties.visibilityExpression}
          onClose={() => setIsVisibilityModalOpen(false)}
          onSave={(name) => {
            onUpdate({ visibilityExpression: name });
            setIsVisibilityModalOpen(false);
          }}
          onDelete={(name) => {
            if (properties.visibilityExpression === name) {
              onUpdate({ visibilityExpression: undefined });
            }
          }}
        />

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

// Normalize color values for <input type="color"> which expects a hex string
const colorToHex = (val: string | undefined, fallback = "#000000") => {
  if (!val) return fallback;
  const s = String(val).trim();
  if (s.startsWith("#")) {
    // ensure 7-char #rrggbb
    if (s.length === 4) {
      // #rgb -> #rrggbb
      return ("#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]).toLowerCase();
    }
    if (s.length === 7) return s.toLowerCase();
    // fallback
    return fallback;
  }

  // rgb(...) or rgba(...)
  const m = s.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (m) {
    const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return fallback;
};
