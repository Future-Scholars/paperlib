import vue from "@vitejs/plugin-vue";
import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import viteTopLevelAwait from "vite-plugin-top-level-await";

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });

export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve"
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    build: {
      rollupOptions: {
        input: {
          index: path.join(__dirname, "app/index.html"),
          index_plugin: path.join(__dirname, "app/index_quickpaste.html"),
        },
      },
      minify: isBuild,
      target: "es2022",
    },
    resolve: {
      alias: {
        "@": path.join(__dirname, "app") + "/",
      },
    },
    esbuild: {
      target: "es2022",
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
        tsconfig: "tsconfig.json",
      },
    },
    plugins: [
      vue(),
      electron([
        {
          // Main process entry file of the Electron App.
          entry: "app/main/main-entry.ts",
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App"
              );
            } else {
              startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist/",
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons,
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
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
          entry: "app/preload/preload.ts",
          onstart({ reload }) {
            // Notify the Renderer process to reload the page when the Preload scripts build is complete,
            // instead of restarting the entire Electron App.
            reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist/",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
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
          onstart({ reload }) {
            // Notify the Renderer process to reload the page when the Preload scripts build is complete,
            // instead of restarting the entire Electron App.
            reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist/",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
              },
            },
            resolve: {
              alias: {
                "@": path.join(__dirname, "app") + "/",
              },
            },
          },
        },
      ]),
      // Use Node.js API in the Renderer process
      renderer({
        resolve: {
          ws: {
            type: "cjs",
          },
          keytar: {
            type: "cjs",
          },
          realm: {
            type: "cjs",
          },
          "electron-log": {
            type: "esm",
          },
          mupdf: {
            type: "esm",
          }
        },
      }),
      viteTopLevelAwait()
    ],
    server:
      (process.env.VSCODE_DEBUG &&
        (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
          return {
            host: url.hostname,
            port: +url.port,
          };
        })()) ||
      {},
    clearScreen: false,
  };
});
