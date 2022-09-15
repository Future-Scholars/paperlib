import vue from "@vitejs/plugin-vue";
import { rmSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import electron, { onstart } from "vite-plugin-electron";

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true }); // v14.14.0
rmSync("release", { recursive: true, force: true }); // v14.14.0

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: "app/main/index.ts",
        vite: {
          build: {
            // For Debug
            sourcemap: true,
            outDir: "dist/app/main",
          },
          // Will start Electron via VSCode Debug
          plugins: [process.env.VSCODE_DEBUG ? onstart() : null],
          resolve: {
            alias: {
              "@": path.join(__dirname, "app") + "/",
            },
          },
        },
      },
      preload: {
        input: {
          // You can configure multiple preload here
          index: path.join(__dirname, "app/preload/index.ts"),
        },
        vite: {
          build: {
            // For Debug
            sourcemap: "inline",
            outDir: "dist/app/preload",
          },
          resolve: {
            alias: {
              "@": path.join(__dirname, "app") + "/",
            },
          },
        },
      },
      // Enables use of Node.js API in the Renderer-process
      // https://github.com/electron-vite/vite-plugin-electron/tree/main/packages/electron-renderer#electron-renderervite-serve
      renderer: {
        resolve() {
          // explicitly specify which packages are Node.js(CJS) packages
          return [
            "webdav",
            "chokidar",
            "realm",
            "keytar",
            "electron-store",
            "got",
            "hpagent",
            "rss-parser",
            "md5-file",
          ];
        },
      },
    }),
  ],

  build: {
    rollupOptions: {
      input: {
        // multiple entry
        index: path.join(__dirname, "index.html"),
        index_preview: path.join(__dirname, "index_preview.html"),
      },
    },
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "app") + "/",
    },
  },
  server: process.env.VSCODE_DEBUG
    ? {
        host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
        port: pkg.debug.env.VITE_DEV_SERVER_PORT,
      }
    : undefined,
});
