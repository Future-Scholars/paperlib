import vue from "@vitejs/plugin-vue";
import { rmSync } from "node:fs";
import path from "node:path";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });
// https://vitejs.dev/config/
export default {
  build: {
    rollupOptions: {
      input: {
        // multiple entry
        index: path.join(__dirname, "app/index.html"),
        index_plugin: path.join(__dirname, "app/index_quickpaste.html"),
      },
    },
    minify: false,
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
      tsconfig: "tsconfig.json",
    },
  },

  esbuild: {
    target: "es2022",
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
    electron([
      {
        entry: "app/main/main-entry.ts",
        vite: {
          build: {
            outDir: "dist",
            sourcemap:
              process.env.NODE_ENV === "development" ? "inline" : false,
            minify: false,
            rollupOptions: {
              external: ["keytar"],
            },
          },
          resolve: {
            alias: {
              "@": path.join(__dirname, "app") + "/",
            },
          },
        },
      },
      {
        entry: "app/extension/extension-entry.ts",
        vite: {
          build: {
            outDir: "dist",
            sourcemap:
              process.env.NODE_ENV === "development" ? "inline" : false,
            minify: false,
            rollupOptions: {
              external: ["keytar", "@future-scholars/live-plugin-manager"],
            },
          },
          resolve: {
            alias: {
              "@": path.join(__dirname, "app") + "/",
            },
          },
        },
      },
      {
        entry: ["app/preload/preload.ts"],
        vite: {
          build: {
            outDir: "dist",
            sourcemap:
              process.env.NODE_ENV === "development" ? "inline" : false,
            minify: false,
          },
          resolve: {
            alias: {
              "@": path.join(__dirname, "app") + "/",
            },
          },
        },
      },
    ]),

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
        "pdfjs-dist": {
          type: "esm",
        },
      },
    }),

    vue(),
  ],
};
