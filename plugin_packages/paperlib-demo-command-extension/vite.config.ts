import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import modify from 'rollup-plugin-modify'

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    manifest: true,
    minify: true,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      fileName: "main",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["paperlib"],
    }
    
  },
  esbuild: {
    keepNames: true
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "src") + "/",
    },
  },

  server: process.env.NODE_ENV
    ? {
        host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
        port: pkg.debug.env.VITE_DEV_SERVER_PORT,
      }
    : undefined,
  
  plugins: [
    // hypothetical({
    //   allowFallthrough: true,
    //   files: {
    //     'paperlib': `
    //       export default {};
    //     `
    //   }
    // }),
    modify({
      find: /import.*from "paperlib";?/,
      // find: /import { PLAPI } from "paperlib";/,
      replace: (match, path) => ""
    })
  ],
});
