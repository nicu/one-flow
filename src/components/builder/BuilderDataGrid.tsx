import * as React from "react";
import type { ComponentProperties } from "../../types";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

interface BuilderDataGridProps {
  properties: ComponentProperties;
  rows?: any[];
}

export const BuilderDataGrid: React.FC<BuilderDataGridProps> = ({
  properties,
  rows = [],
}) => {
  const columns: GridColDef[] = (properties.columns || []).map((c) => ({
    field: c.field,
    headerName: c.headerName || c.field,
    width: c.width || 150,
  }));

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
      />
    </div>
  );
};

export default BuilderDataGrid;
