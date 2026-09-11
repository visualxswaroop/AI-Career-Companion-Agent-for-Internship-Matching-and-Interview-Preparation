import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/resume': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/cover-letter': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/career-assistant': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/interview-agent': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/voice-resume': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
