import * as React from "react";
import type { ComponentProperties } from "../../types";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";

interface BuilderDataGridProps {
  properties: ComponentProperties;
  rows?: any[];
}

export const BuilderDataGrid: React.FC<BuilderDataGridProps> = ({
  properties,
  rows = [],
}) => {
  const formatCellValue = (val: unknown): string => {
    if (val == null) return "";
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      // Common pattern: name object with first/last
      if (
        (typeof obj.first === "string" || typeof obj.last === "string")
      ) {
        return `${(obj.first as string) || ""}${obj.first && obj.last ? " " : ""}${(obj.last as string) || ""}`.trim();
      }
      // If object has 'name' string
      if (typeof obj.name === "string") return obj.name as string;
      try {
        return JSON.stringify(obj);
      } catch {
        return String(obj);
      }
    }
    return String(val);
  };

  const columns: GridColDef[] = (properties.columns || []).map((c) => {
    const col: GridColDef = {
      field: c.field,
      headerName: c.headerName || c.field,
      width: c.width || 150,
    };

    if (c.render === "chip") {
      col.renderCell = (params: GridRenderCellParams) => {
        const val = params.value;
        // boolean -> friendly label
        const label =
          typeof val === "boolean" ? (val ? "Yes" : "No") : formatCellValue(val ?? "");
        const chipColor: "default" | "success" =
          typeof val === "boolean" ? (val ? "success" : "default") : "default";
        return <Chip label={label} color={chipColor} size="small" />;
      };
    } else {
      col.renderCell = (params: GridRenderCellParams) => (
        <span>{formatCellValue(params.value)}</span>
      );
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
      renderCell: (params: GridRenderCellParams) => (
        <span>{formatCellValue(params.value)}</span>
      ),
    }));
  }, [columns, rows]);

  const pageSize = properties.pageSize || 5;

  return (
    <div style={{ width: "100%", height: properties.height || 400 }}>
      <DataGrid
        rows={rows || []}
        columns={inferredColumns}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        density="compact"
        rowHeight={48}
        initialState={{ pagination: { paginationModel: { pageSize } } }}
        pageSizeOptions={[5, 10, 20, 50]}
        sx={{
          borderRadius: 2,
          // Ensure inner DataGrid elements don't keep rounded corners
          ".MuiDataGrid-main": { borderRadius: 0 },
          ".MuiDataGrid-virtualScroller": { borderRadius: 0 },
          boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
          border: "1px solid rgba(0,0,0,0.06)",
          fontFamily: "'" + ((properties as unknown as Record<string, unknown>).fontFamily as string || "Inter") + "'",
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
