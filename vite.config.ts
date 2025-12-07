import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  root: './src-vue',
  base: './',
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src-vue'),
    },
  },
  server: {
    port: 8001,
    // open: true,
  },
})
