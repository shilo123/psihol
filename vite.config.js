import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/shared',
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          // Prevent buffering of SSE streams
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              res.setHeader('X-Accel-Buffering', 'no');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
            }
          });
        },
      }
    }
  }
})
