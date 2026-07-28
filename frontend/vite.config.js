import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Same paths Nginx exposes in production, so the SPA can use relative URLs.
      '/api': 'http://localhost:4000',
      '/images': 'http://localhost:4000',
    },
  },
})
