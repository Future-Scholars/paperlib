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
      external: [
        ...builtinModules,
        "keytar",
        "chokidar",
        "pdfjs-dist",
        "electron",
        "electron-log",
        "electron-store",
        "electron-updater",
        "md5-file",
        "realm",
        "pdfjs-dist/build/pdf.mjs",
        "pdfjs-dist/types/src/display/api",
        "fast-xml-parser",
        "katex",
        "markdown-it",
        "markdown-it-texmath",
        "toad-scheduler",
        "vue",
        "@future-scholars/live-plugin-manager",
      ],
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
