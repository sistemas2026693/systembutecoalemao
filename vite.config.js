import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true
      }
    },
    allowedHosts: ['.monkeycode-ai.live']
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000
  }
})
