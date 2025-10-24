import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  root: path.resolve(__dirname, 'src'),
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '^/api/(?!.*\\.(ts|js|vue)$)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/actor': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/inbox': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/nodeinfo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../relay/public'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        admin: path.resolve(__dirname, 'src/admin/index.html'),
      },
    },
  },
})
