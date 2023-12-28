import { builtinModules } from "module";
import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [...builtinModules],
    },
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    copyPublicDir: false,
    target: "esnext",
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "../app") + "/",
    },
  },

  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
