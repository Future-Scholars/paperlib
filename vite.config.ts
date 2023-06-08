import renderer from "@future-scholars/vite-plugin-electron-renderer";
import vue from "@vitejs/plugin-vue";
import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // multiple entry
        index: path.join(__dirname, "app/index.html"),
        index_preview: path.join(__dirname, "app/index_preview.html"),
        index_plugin: path.join(__dirname, "app/index_plugin.html"),
      },
    },
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "app") + "/",
    },
  },

  server: process.env.NODE_ENV
    ? {
        host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
        port: pkg.debug.env.VITE_DEV_SERVER_PORT,
      }
    : undefined,

  plugins: [
    electron({
      entry: [
        "app/main/main.ts",
        "app/preload/preload.ts",
        "app/extension/extension-entry.ts",
      ],
      vite: {
        build: {
          outDir: "dist",
          sourcemap: process.env.NODE_ENV === "development" ? "inline" : false,
          minify: process.env.NODE_ENV === "production",
        },
      },
    }),
    renderer({
      resolve: {
        "electron-store": {
          type: "cjs",
        },
        ws: {
          type: "cjs",
        },
        got: {
          type: "esm",
        },
        keytar: {
          type: "cjs",
        },
        chokidar: {
          type: "cjs",
        },
        realm: {
          type: "cjs",
        },
        "node-html-parser": {
          type: "esm",
        },
        "electron-log": {
          type: "esm",
        },
      },
      browserField: false,
    }),
    vue(),
  ],
});
