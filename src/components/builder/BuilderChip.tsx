import React from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { ComponentProperties } from "../../types";
import { useDataContext } from "../../contexts/DataContext";

interface Props {
  properties: ComponentProperties;
}

export const BuilderChip: React.FC<Props> = ({ properties }) => {
  const dataContext = useDataContext();
  const modelId =
    properties.dataBinding?.modelId || properties.dataBinding?.collectionId;
  const field = properties.chipField || "location";
  const [selected, setSelected] = React.useState<string | null>(null);

  const chips = React.useMemo(() => {
    if (!dataContext || !modelId) return [] as string[];
    const rows = dataContext.dataStore.data[modelId] || [];
    const map = new Map<string, number>();
    rows.forEach((r: any) => {
      const v = String(r[field] ?? "") || "(empty)";
      map.set(v, (map.get(v) || 0) + 1);
    });
    return Array.from(map.keys());
  }, [dataContext, modelId, field]);

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {chips.map((c) => (
        <Chip
          key={c}
          label={c}
          color={selected === c ? "primary" : "default"}
          onClick={() => setSelected(selected === c ? null : c)}
          sx={{ marginBottom: 1 }}
        />
      ))}
    </Stack>
  );
};

export default BuilderChip;
