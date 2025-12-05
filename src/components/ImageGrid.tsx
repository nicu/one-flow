import React, { useId } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { ComponentProperties } from "../types";
import { useDataContext } from "../contexts/DataContext";

interface ImageGridProps {
  properties?: ComponentProperties;
  componentId?: string;
}

const positionMap: Record<string, { justify: string; align: string }> = {
  "top-left": { justify: "flex-start", align: "flex-start" },
  "top-center": { justify: "center", align: "flex-start" },
  "top-right": { justify: "flex-end", align: "flex-start" },
  "center-left": { justify: "flex-start", align: "center" },
  "center-center": { justify: "center", align: "center" },
  "center-right": { justify: "flex-end", align: "center" },
  "bottom-left": { justify: "flex-start", align: "flex-end" },
  "bottom-center": { justify: "center", align: "flex-end" },
  "bottom-right": { justify: "flex-end", align: "flex-end" },
};

const ImageGrid: React.FC<ImageGridProps> = ({ properties = {} }) => {
  const dataContext = useDataContext();

  const id = useId();

  // Determine items: prefer DataContext (when rendering bound collections),
  // otherwise fall back to explicit `items` prop if present.
  let items: any[] = [];
  const binding = properties.dataBinding;
  if (binding?.collectionId && dataContext) {
    items = dataContext.dataStore.data[binding.collectionId] || [];
    const shouldUnwrap = binding?.unwrapResults !== false;
    if (
      shouldUnwrap &&
      Array.isArray(items) &&
      items.length === 1 &&
      items[0] != null &&
      Array.isArray(items[0].results)
    ) {
      items = items[0].results;
    }
  } else if ((properties as any).items) {
    items = (properties as any).items;
  } else {
    // sample placeholder items
    items = [
      {
        id: "1",
        title: "Sample A",
        image: "https://picsum.photos/300/200?random=1",
      },
      {
        id: "2",
        title: "Sample B",
        image: "https://picsum.photos/300/200?random=2",
      },
      {
        id: "3",
        title: "Sample C",
        image: "https://picsum.photos/300/200?random=3",
      },
    ];
  }

  const title = (properties as any).title;
  const titleVariant = (properties as any).titleVariant || "h2";
  const itemTitleField = (properties as any).itemTitleField || "title";
  const itemImageField = (properties as any).itemImageField || "image";
  const imagePosition = (properties as any).imagePosition || "center-center";

  const cols = (() => {
    const g = properties.gridColumns;
    if (!g) return 3;
    if (typeof g === "number") return g;
    return g.desktop || g.tablet || g.mobile || 3;
  })();

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: properties.gap || "12px",
    width: properties.width || "100%",
  };

  return (
    <Box id={`image-grid-${id}`} sx={{ padding: properties.padding || "0" }}>
      {title && (
        <Typography variant={titleVariant as any} sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ ...gridStyle }}>
        {items.map((it: any, idx: number) => {
          const imgSrc = it && itemImageField ? it[itemImageField] || "" : "";
          const imgTitle = it && itemTitleField ? it[itemTitleField] || "" : "";
          const pos =
            positionMap[imagePosition] || positionMap["center-center"];

          return (
            <Box
              key={it?.id || idx}
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: properties.borderRadius || 1,
                boxShadow: properties.boxShadow || "none",
                minHeight: 120,
              }}
            >
              {imgSrc ? (
                <Box
                  component="img"
                  src={imgSrc}
                  alt={imgTitle}
                  sx={{
                    width: "100%",
                    height: 180,
                    objectFit: properties.objectFit || "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Box sx={{ background: "#f3f4f6", height: 180 }} />
              )}

              {imgTitle?.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    justifyContent: pos.justify,
                    alignItems: pos.align,
                    p: 1,
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      background: "rgba(0,0,0,0.5)",
                      color: "#fff",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      pointerEvents: "auto",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {imgTitle}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ImageGrid;
