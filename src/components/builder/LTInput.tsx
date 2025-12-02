import React from "react";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { useTheme } from "../../theme";

const LTInput: React.FC<{ properties?: ComponentProperties }> = ({
  properties,
}) => {
  const props = properties || ({} as ComponentProperties);
  const dataContext = useDataContext();
  const { theme } = useTheme();
  const binding = props.dataBinding;

  let placeholder = props.placeholder ?? "";
  if (binding?.fieldId && dataContext) {
    const { currentItem, dataStore } = dataContext;
    const resolvePath = (obj: any, path: string) => {
      if (!obj) return null;
      return path.split(".").reduce((acc, p) => acc?.[p], obj);
    };
    if (currentItem) {
      const v = resolvePath(currentItem, binding.fieldId);
      if (v != null) placeholder = String(v);
    } else if (binding?.modelId && dataStore) {
      const modelArr = dataStore.data[binding.modelId];
      if (Array.isArray(modelArr) && modelArr.length > 0) {
        const v = resolvePath(modelArr[0], binding.fieldId);
        if (v != null) placeholder = String(v);
      }
    }
  }

  const style: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: theme?.borderRadius?.input ?? "8px",
    border: "1px solid #d1d5db",
    width: props.width ?? "100%",
  };

  return <input style={style} placeholder={placeholder} />;
};

export default LTInput;
