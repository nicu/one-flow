import * as React from "react";
import type { ComponentProperties } from "../../types";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";

interface BuilderDataGridProps {
  properties: ComponentProperties;
  rows?: any[];
}

export const BuilderDataGrid: React.FC<BuilderDataGridProps> = ({
  properties,
  rows = [],
}) => {
  const columns: GridColDef[] = (properties.columns || []).map((c) => {
    const col: GridColDef = {
      field: c.field,
      headerName: c.headerName || c.field,
      width: c.width || 150,
    };

    if (c.render === "chip") {
      col.renderCell = (params) => {
        const val = params.value;
        // boolean -> friendly label
        const label =
          typeof val === "boolean" ? (val ? "Yes" : "No") : String(val ?? "");
        const color =
          typeof val === "boolean" ? (val ? "success" : "default") : "default";
        return <Chip label={label} color={color as any} size="small" />;
      };
    }

    return col;
  });

  // If no columns defined, infer from first row
  const inferredColumns: GridColDef[] = React.useMemo(() => {
    if (columns.length > 0) return columns;
    const first = rows && rows.length > 0 ? rows[0] : null;
    if (!first) return [];
    return Object.keys(first).map((k) => ({
      field: k,
      headerName: k,
      width: 150,
    }));
  }, [columns, rows]);

  const pageSize = properties.pageSize || 5;

  return (
    <div style={{ width: "100%", height: properties.height || 400 }}>
      <DataGrid
        rows={rows || []}
        columns={inferredColumns}
        pageSize={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        disableSelectionOnClick
        getRowId={(row) => row.id}
        density="compact"
        rowHeight={48}
        headerHeight={56}
        sx={{
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
          border: "1px solid rgba(0,0,0,0.06)",
          fontFamily: "'" + (properties?.fontFamily || "Inter") + "'",
          ".MuiDataGrid-cell": { padding: "8px 12px", fontSize: 14 },
          ".MuiDataGrid-columnHeaders": {
            backgroundColor: "#fafafa",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          },
          ".MuiDataGrid-row:hover": { backgroundColor: "#f5f7ff" },
        }}
      />
    </div>
  );
};

export default BuilderDataGrid;
