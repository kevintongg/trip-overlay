import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index-react.html', // React trip overlay
        dashboard: 'dashboard.html', // React dashboard (promoted from dashboard-react.html)
      },
    },
  },
  // Serve assets and css from public directory
  publicDir: 'public',
});
