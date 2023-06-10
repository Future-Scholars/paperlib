import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(__dirname, "app") + "/",
    },
  },
});
