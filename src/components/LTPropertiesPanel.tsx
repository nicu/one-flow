import React, { useState, useMemo } from "react";
import { useTheme } from "../theme";
import type { BuilderComponent, ComponentProperties } from "../types";

interface LTProps {
  component: BuilderComponent | null;
  onUpdate: (props: Partial<ComponentProperties>) => void;
  onDelete?: () => void;
}

const sizeKeys = ["xs", "sm", "md", "lg", "xl", "custom"] as const;
const sizeLabels: Record<string, string> = {
  xs: "XS",
  sm: "SM",
  md: "MD",
  lg: "LG",
  xl: "XL",
  custom: "Custom",
};

const colorSteps = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Simple hex lighten/darken helper
function adjustHex(hex: string, amount: number) {
  try {
    const col = hex.replace("#", "");
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch (e) {
    return hex;
  }
}

export const LTPropertiesPanel: React.FC<LTProps> = ({
  component,
  onUpdate,
  onDelete,
}) => {
  const { theme } = useTheme();
  const props = component?.properties || {};

  // Provide theme-derived sizes for quick selection
  const themeSizes = useMemo(() => {
    return {
      xs: "0.5rem",
      sm: "0.75rem",
      md: (theme as any).typography?.body1?.fontSize || "1rem",
      lg: (theme as any).typography?.h3?.fontSize || "1.25rem",
      xl: (theme as any).typography?.h2?.fontSize || "1.5rem",
    } as Record<string, string>;
  }, [theme]);

  // Colors: generate palette from primary color
  const palette = useMemo(() => {
    const base =
      (theme as any).palette?.primary?.main || (theme as any).colors?.primary || "#1976d2";
    // generate 9 shades by adjusting brightness
    const arr = colorSteps.map((_, idx) => {
      const amt = Math.round((idx - 4) * 12); // -48 .. +48
      return adjustHex(base, amt);
    });
    return arr;
  }, [theme]);

  const [selectedSizeKey, setSelectedSizeKey] = useState<string>("md");
  const [customSize, setCustomSize] = useState<string>(props.fontSize || "");
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const [customColor, setCustomColor] = useState<string>(props.color || "");

  // Normalize color values for <input type="color"> which expects a hex string
  const colorToHex = (val: string | undefined, fallback = "#000000") => {
    if (!val) return fallback;
    const s = String(val).trim();
    if (s.startsWith("#")) {
      if (s.length === 4) {
        return ("#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]).toLowerCase();
      }
      if (s.length === 7) return s.toLowerCase();
      return fallback;
    }
    const m = s.match(
      /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i
    );
    if (m) {
      const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
      const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
      const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return fallback;
  };

  const applySize = (key: string) => {
    setSelectedSizeKey(key);
    if (key === "custom") {
      onUpdate({ fontSize: customSize });
    } else {
      onUpdate({ fontSize: themeSizes[key] });
      setCustomSize("");
    }
  };

  const applyColor = (idx: number | null) => {
    setSelectedColorIdx(idx);
    if (idx === null) {
      onUpdate({ color: customColor });
    } else {
      onUpdate({ color: palette[idx] });
      setCustomColor("");
    }
  };

  // Normalize shadows: theme may provide an array or an object (legacy/defaultTheme uses array,
  // theme/index.tsx defines shadows as an object). Ensure we have an array to map over.
  const shadowsList: string[] = Array.isArray((theme as any).shadows)
    ? ((theme as any).shadows as string[])
    : (theme as any).shadows
    ? (Object.values((theme as any).shadows) as string[])
    : [];

  if (!component) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <div className="no-selection">Select a component to edit LT props</div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>LT Properties</h3>
        <div className="component-type">{component.type}</div>
      </div>

      <div className="properties-content">
        <div className="property-group">
          <h4>Typography Size</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {sizeKeys.map((k) => (
              <button
                key={k}
                className={`btn-ghost ${selectedSizeKey === k ? "active" : ""}`}
                onClick={() => applySize(k)}
              >
                {sizeLabels[k]}
              </button>
            ))}
            <input
              type="text"
              value={
                selectedSizeKey === "custom"
                  ? customSize
                  : themeSizes[selectedSizeKey]
              }
              disabled={selectedSizeKey !== "custom"}
              onChange={(e) => {
                setCustomSize(e.target.value);
                if (selectedSizeKey === "custom")
                  onUpdate({ fontSize: e.target.value });
              }}
              style={{ marginLeft: 8, width: 120 }}
            />
          </div>
        </div>

        <div className="property-group">
          <h4>Spacing</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {sizeKeys.map((k) => (
              <button
                key={`sp-${k}`}
                className={`btn-ghost ${selectedSizeKey === k ? "active" : ""}`}
                onClick={() => {
                  // apply spacing to padding
                  const val = k === "custom" ? customSize : themeSizes[k];
                  onUpdate({ padding: val });
                  setSelectedSizeKey(k);
                }}
              >
                {sizeLabels[k]}
              </button>
            ))}
            <input
              type="text"
              value={props.padding || ""}
              disabled={selectedSizeKey !== "custom"}
              onChange={(e) => onUpdate({ padding: e.target.value })}
              style={{ marginLeft: 8, width: 120 }}
            />
          </div>
        </div>

        <div className="property-group">
          <h4>Elevation</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {shadowsList.map((s: string, idx: number) => (
              <button
                key={`sh-${idx}`}
                className={`btn-ghost ${props.boxShadow === s ? "active" : ""}`}
                onClick={() => onUpdate({ boxShadow: s })}
                title={s}
              >
                {idx}
              </button>
            ))}
          </div>
        </div>

        <div className="property-group">
          <h4>Color (Primary scale)</h4>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {palette.map((c, idx) => (
              <button
                key={`pal-${idx}`}
                className={`color-swatch ${
                  selectedColorIdx === idx ? "selected" : ""
                }`}
                onClick={() => applyColor(idx)}
                style={{
                  background: c,
                  width: 28,
                  height: 28,
                  border: "1px solid #ddd",
                }}
                title={`Step ${colorSteps[idx]}`}
              />
            ))}
            <button
              className={`btn-ghost ${
                selectedColorIdx === null ? "active" : ""
              }`}
              onClick={() => applyColor(null)}
            >
              Custom
            </button>
            <input
              type="color"
              value={colorToHex(
                selectedColorIdx === null
                  ? customColor || "#000000"
                  : palette[selectedColorIdx],
                "#000000"
              )}
              onChange={(e) => {
                setCustomColor(e.target.value);
                applyColor(null);
              }}
              style={{ marginLeft: 8 }}
            />
          </div>
        </div>
        {onDelete && (
          <div className="property-group">
            <button
              className="delete-button"
              onClick={() => onDelete && onDelete()}
            >
              Delete Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LTPropertiesPanel;
