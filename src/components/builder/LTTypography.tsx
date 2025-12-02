import React from "react";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { useTheme } from "../../theme";

const LTTypography: React.FC<{ properties?: ComponentProperties }> = ({
  properties,
}) => {
  const props = properties || ({} as ComponentProperties);
  const dataContext = useDataContext();
  const { theme } = useTheme();
  const binding = props.dataBinding;

  let text = props.text ?? "Text";
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
    fontSize: props.fontSize ?? theme.typography?.fontSize?.base,
    fontWeight: props.fontWeight ?? 400,
    color: props.color ?? theme?.colors?.text,
  };

  return <div style={style}>{text}</div>;
};

export default LTTypography;
