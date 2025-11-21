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
  const field = properties.tabField || "available";

  const tabs: Array<{ key: string; label: string; count: number }> =
    React.useMemo(() => {
      if (!dataContext || !modelId)
        return [{ key: "all", label: "All", count: 0 }];
      const rows = dataContext.dataStore.data[modelId] || [];
      if (!rows || rows.length === 0)
        return [{ key: "all", label: "All", count: 0 }];

      // Handle boolean field specially
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

      // Otherwise derive unique values
      const map = new Map<string, number>();
      rows.forEach((r: any) => {
        const v = String(r[field] ?? "") || "(empty)";
        map.set(v, (map.get(v) || 0) + 1);
      });

      const out = [
        { key: "all", label: `All (${rows.length})`, count: rows.length },
      ];
      Array.from(map.entries()).forEach(([k, c]) =>
        out.push({ key: k, label: `${k} (${c})`, count: c })
      );
      return out;
    }, [dataContext, modelId, field]);

  const handleChange = (e: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs value={value} onChange={handleChange} aria-label="hotel-tabs">
        {tabs.map((t) => (
          <Tab key={t.key} label={t.label} />
        ))}
      </Tabs>
    </Box>
  );
};

export default BuilderTabs;
