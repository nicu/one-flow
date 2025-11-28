import React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";

interface Props {
  properties: ComponentProperties;
}

export const BuilderTabs: React.FC<Props> = ({ properties }) => {
  const dataContext = useDataContext();
  const [value, setValue] = React.useState(0);

  const modelId =
    properties.dataBinding?.modelId || properties.dataBinding?.collectionId;
  const field =
    properties.dataBinding?.fieldId || properties.tabField || "available";
  const tabs: Array<{ key: string; label: string; count?: number }> =
    React.useMemo(() => {
      if (!dataContext || !modelId)
        return [{ key: "all", label: "All", count: 0 }];

      const rows = dataContext.dataStore.data[modelId] || [];
      if (!rows || rows.length === 0)
        return [{ key: "all", label: "All", count: 0 }];

      // If this component is bound to a collection (collectionId), create
      // one tab per item and use `tabField` to derive the label for each
      // item. This allows binding tabs directly to items in a dataset.
      const collectionId = properties.dataBinding?.collectionId;
      const resolvePath = (obj: any, path: string) => {
        if (!obj) return undefined;
        const parts = path.split(".");
        let cur = obj;
        for (const p of parts) {
          if (cur == null) return undefined;
          cur = cur[p];
        }
        return cur;
      };

      if (collectionId) {
        return rows.map((r: any, idx: number) => {
          const raw = resolvePath(r, field) ?? r.name ?? r.title ?? "";
          const label =
            raw === undefined || raw === null ? `Item ${idx + 1}` : String(raw);
          const key = (r && (r.id || r._id)) || `item-${idx}`;
          return { key: String(key), label };
        });
      }

      // Handle boolean field specially (grouping)
      if (typeof rows[0][field] === "boolean") {
        const available = rows.filter((r: any) => r[field] === true).length;
        const unavailable = rows.length - available;
        return [
          { key: "all", label: `All (${rows.length})`, count: rows.length },
          {
            key: "available",
            label: `Available (${available})`,
            count: available,
          },
          {
            key: "unavailable",
            label: `Unavailable (${unavailable})`,
            count: unavailable,
          },
        ];
      }

      // Otherwise derive unique values (grouping)
      const map = new Map<string, number>();
      rows.forEach((r: any) => {
        const v = String(r[field] ?? "") || "(empty)";
        map.set(v, (map.get(v) || 0) + 1);
      });

      const out: Array<{ key: string; label: string; count?: number }> = [
        { key: "all", label: `All (${rows.length})`, count: rows.length },
      ];
      Array.from(map.entries()).forEach(([k, c]) =>
        out.push({ key: k, label: `${k} (${c})`, count: c })
      );
      return out;
    }, [dataContext, modelId, field, properties.dataBinding?.collectionId]);

  const handleChange = (_e: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="hotel-tabs"
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { backgroundColor: "#1976d2", height: 3 } }}
      >
        {tabs.map((t) => (
          <Tab
            key={t.key}
            label={t.label}
            disableRipple
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "14px" }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default BuilderTabs;
