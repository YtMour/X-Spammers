import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: [
        'electron/main.ts',
        'electron/preload.ts'
      ],
      vite: {
        build: {
          rollupOptions: {
            external: ['electron', 'fs', 'path', 'util']
          }
        }
      }
    }),
    renderer({
      optimizeDeps: {
        exclude: ['electron']
      }
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'util']
    }
  },
})
