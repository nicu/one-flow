import React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { ComponentProperties } from "../../types";

interface Props {
  properties: ComponentProperties;
}

export const BuilderBreadcrumbs: React.FC<Props> = ({ properties }) => {
  const items = properties.breadcrumbs || ["Home", "Admin", "Hotels"];

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {items.map((it, idx) =>
        idx === items.length - 1 ? (
          <Typography key={idx} color="text.primary">
            {it}
          </Typography>
        ) : (
          <Link key={idx} color="inherit" href="#" underline="hover">
            {it}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
};

export default BuilderBreadcrumbs;
