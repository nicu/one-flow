import type { Plugin } from "../types";
import React from "react";
import LazyUserList from "../../components/LazyUserList";

const plugin: Plugin = {
  manifest: {
    id: "of.lazy-user-list",
    name: "Lazy User List",
    version: "0.0.1",
    description: "Registers a lazily-loading user list component",
  },
  install(ctx) {
    ctx.components.registerComponent("lazy-user-list", {
      displayName: "Lazy User List",
      defaultProps: {
        title: "Users",
        titleVariant: "h2",
        gap: "12px",
        gridColumns: 1,
        count: 12,
        enterDuration: 400,
        exitDuration: 300,
        animation: "none",
      },
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          itemClassName: { type: "string" },
          imageClassName: { type: "string" },
          count: { type: "number", minimum: 1, maximum: 500 },
          intersectionThreshold: { type: "number", minimum: 0, maximum: 1 },
          intersectionRootMargin: { type: "string" },
          enterDuration: { type: "number", minimum: 0 },
          exitDuration: { type: "number", minimum: 0 },
          animation: {
            type: "string",
            enum: [
              "none",
              "debug",
              "fade",
              "slide-left",
              "slide-right",
              "scale-in",
              "scale-out",
            ],
          },
        },
      },
      renderPreview: (props: any) =>
        React.createElement(LazyUserList, { properties: props }),
    });

    return;
  },
};

export default plugin;
