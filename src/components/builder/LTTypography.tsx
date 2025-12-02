import React from "react";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";
import { useTheme } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { getResponsiveValue } from "../../utils/responsive";

const LTTypography: React.FC<{ properties?: ComponentProperties }> = ({
  properties,
}) => {
  const props = properties || ({} as ComponentProperties);
  const dataContext = useDataContext();
  const { theme } = useTheme();
  const { breakpoint } = useBreakpoint();
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
      const arr = dataStore.data[binding.modelId] || [];
      // allow `any` for runtime item lookup
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
        const v = resolvePath(item, binding.fieldId);
        if (v != null) text = String(v);
      }
    }
  }

  const style: React.CSSProperties = {
    fontSize:
      (getResponsiveValue(props.fontSize, breakpoint) as any) ??
      theme.typography?.fontSize?.base,
    fontWeight:
      (getResponsiveValue(props.fontWeight, breakpoint) as any) ?? 400,
    color:
      (getResponsiveValue(props.color, breakpoint) as any) ??
      theme?.colors?.text,
  };

  return <div style={style}>{text}</div>;
};

export default LTTypography;
