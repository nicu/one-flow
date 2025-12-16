import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Set base to the repository subpath so GitHub Pages serves absolute
  // asset URLs that include the repo name.
  base: "/one-flow/",
  build: {
    outDir: "docs",
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4040",
        changeOrigin: true,
      },
    },
  },
});
