import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Proxy all API calls to the Express backend – no CORS issues in dev
    proxy: {
      '/auth':         'http://localhost:5000',
      '/seniors':      'http://localhost:5000',
      '/sessions':     'http://localhost:5000',
      '/availability': 'http://localhost:5000',
      '/profile':      'http://localhost:5000',
      '/credibility':  'http://localhost:5000',
    },
  },
});
