import React from "react";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { useTheme } from "../../theme";

const LTButton: React.FC<{ properties?: ComponentProperties }> = ({
  properties,
}) => {
  const props = properties || ({} as ComponentProperties);
  const dataContext = useDataContext();
  const { theme } = useTheme();
  const binding = props.dataBinding;

  let text = props.buttonText ?? "Button";
  if (binding?.fieldId && dataContext) {
    const { currentItem, dataStore } = dataContext;
    const resolvePath = (obj: any, path: string) => {
      if (!obj) return null;
      return path.split(".").reduce((acc, p) => acc?.[p], obj);
    };
    if (currentItem) {
      const v = resolvePath(currentItem, binding.fieldId);
      if (v != null) text = String(v);
    } else if (binding?.modelId && dataStore) {
      const modelArr = dataStore.data[binding.modelId];
      if (Array.isArray(modelArr) && modelArr.length > 0) {
        const v = resolvePath(modelArr[0], binding.fieldId);
        if (v != null) text = String(v);
      }
    }
  }

  const style: React.CSSProperties = {
    background: props.buttonColor ?? theme?.colors?.primary,
    color: props.buttonTextColor ?? theme?.colors?.text,
    padding: "8px 12px",
    border: "none",
    borderRadius: theme?.borderRadius?.button ?? "8px",
    cursor: "pointer",
  };

  return <button style={style}>{text}</button>;
};

export default LTButton;
