import vue from "@vitejs/plugin-vue";
import { existsSync, rmSync } from "node:fs";
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
    minify: process.env.NODE_ENV !== "development",
    target: "es2022",
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
    {
      name: "rebuild-script",
      buildStart(options) {
        console.log("Rebuilding dependencies...");
        // Electron rebuild for pnpm
        if (
          !existsSync(
            "node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework"
          )
        ) {
          rmSync("node_modules/electron/dist", {
            recursive: true,
            force: true,
          });

          require("child_process").spawnSync(
            "node",
            ["node_modules/electron/install.js"],
            {
              stdio: "inherit",
            }
          );
        }
      },
    },

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
        ws: {
          type: "cjs",
        },
        keytar: {
          type: "cjs",
        },
        got: {
          type: "esm",
        },
        chokidar: {
          type: "cjs",
        },
        realm: {
          type: "cjs",
        },
        "electron-log": {
          type: "esm",
        },
      },
    }),

    vue(),
  ],
};
