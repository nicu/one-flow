import type { Plugin } from "../types";
import React from "react";
import ImageGrid from "../../components/ImageGrid";

const plugin: Plugin = {
  manifest: {
    id: "of.image-grid",
    name: "Image Grid Component",
    version: "0.0.1",
    description:
      "Registers an Image Grid component that can be bound to collections",
  },
  install(ctx) {
    ctx.components.registerComponent("image-grid", {
      displayName: "Image Grid",
      defaultProps: {
        title: "Gallery",
        titleVariant: "h2",
        itemTitleField: "title",
        itemImageField: "image",
        imagePosition: "center-center",
        gap: "12px",
        gridColumns: 3,
      },
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          titleVariant: { type: "string" },
          itemTitleField: { type: "string" },
          itemImageField: { type: "string" },
          imagePosition: { type: "string" },
        },
      },
      // renderPreview is called inside the canvas; we can use React hooks here
      renderPreview: (props: any) => {
        return React.createElement(ImageGrid, { properties: props });
      },
    });

    return;
  },
};

export default plugin;
