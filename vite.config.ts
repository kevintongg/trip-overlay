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
        main: path.resolve(__dirname, 'index-react.html'), // React trip overlay
        dashboard: path.resolve(__dirname, 'dashboard.html'), // React dashboard
        landing: path.resolve(__dirname, 'index.html'), // Landing page
      },
    },
  },
  // Serve assets and css from public directory
  publicDir: 'public',
});
