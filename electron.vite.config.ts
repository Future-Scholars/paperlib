import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@': resolve('app/')
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'app/main/main-entry.ts'),
        },
        output: {
          format: 'es'
        }
      },
      outDir: 'dist/main',
    }
  },
  preload: {
    resolve: {
      alias: {
        '@': resolve('app/')
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'app/preload/preload.ts'),
          preload_quickpaste: resolve(__dirname, 'app/preload/preload_quickpaste.ts')
        },
        output: {
          format: 'es'
        }
      },
      outDir: 'dist/preload',
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('app/'),
        'path': "path-browserify",
      }
    },
    plugins: [vue()],
    root: "app/renderer/",
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'app/renderer/index.html'),
          index_quickpaste: resolve(__dirname, 'app/renderer/index_quickpaste.html')
        },
      },
      outDir: 'dist/renderer',
    },
    optimizeDeps: {
      include: ['path-browserify']
    }
  }
})
