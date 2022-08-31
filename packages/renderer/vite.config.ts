import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron-renderer";
import pkg from "../../package.json";

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  plugins: [
    vue(),
    electron(),
    // resolve(
    //   /**
    //    * Here you can specify other modules
    //    * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
    //    *    which will ensure that the electron-builder can package it correctly
    //    */
    //   {
    //     // If you use electron-store, this will work
    //     'electron-store': 'const Store = require("electron-store"); export default Store;',
    //   }
    // ),
  ],
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        // multiple entry
        index: resolve(__dirname, "index.html"),
        index_plugin: resolve(__dirname, "index_plugin.html"),
        index_preview: resolve(__dirname, "index_preview.html"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        manualChunks: {},
      },
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
