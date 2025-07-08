import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin to copy functions directory to dist
function copyFunctionsPlugin() {
  return {
    name: 'copy-functions',
    writeBundle() {
      const sourceDir = 'functions';
      const targetDir = 'dist/_functions'; // Cloudflare Pages requires _functions

      if (existsSync(sourceDir)) {
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }

        // Copy weather.js
        const sourceFile = path.join(sourceDir, 'weather.js');
        const targetFile = path.join(targetDir, 'weather.js');

        if (existsSync(sourceFile)) {
          copyFileSync(sourceFile, targetFile);
          console.log('✅ Copied functions/weather.js to dist/_functions/');
        }
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyFunctionsPlugin()],
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
        main: path.resolve(__dirname, 'index.html'), // Landing page (default)
        trip: path.resolve(__dirname, 'trip.html'), // React trip overlay
        dashboard: path.resolve(__dirname, 'dashboard.html'), // React dashboard
      },
    },
  },
  // Serve assets and css from public directory
  publicDir: 'public',
});
