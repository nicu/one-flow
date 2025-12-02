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
      const arr = dataStore.data[binding.modelId] || [];
      // allow `any` here for flexible runtime binding objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let item: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = binding as any;
      if (typeof b.itemIndex === "number") {
        item = arr[Math.max(0, Math.min(b.itemIndex, arr.length - 1))];
      } else if (b.itemId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item = arr.find(
          (it: any) => it && (it.id === b.itemId || it._id === b.itemId)
        );
      } else if (arr.length > 0) {
        item = arr[0];
      }

      if (item) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v = resolvePath(item as any, binding.fieldId);
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
