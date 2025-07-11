import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

// Plugin to copy functions directory to dist
function copyFunctionsPlugin() {
  return {
    name: 'copy-functions',
    writeBundle() {
      const sourceDir = 'functions';
      const targetDir = 'dist/functions';

      if (existsSync(sourceDir)) {
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }

        // Copy all .js files from functions directory
        const files = readdirSync(sourceDir).filter(file =>
          file.endsWith('.js')
        );

        files.forEach(file => {
          const sourceFile = path.join(sourceDir, file);
          const targetFile = path.join(targetDir, file);
          copyFileSync(sourceFile, targetFile);
          console.log(`✅ Copied functions/${file} to dist/functions/`);
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyFunctionsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // For local development, you can either:
    // 1. Set environment variables (OWM_API_KEY, OPENCAGE_API_KEY) and use the dev-functions.js script
    // 2. Or the functions will gracefully fallback to Nominatim for geocoding
    proxy: {
      // Uncomment these lines if you want to proxy to a local function server
      // '/weather': 'http://localhost:8787',
      // '/geocode': 'http://localhost:8787',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        trip: path.resolve(__dirname, 'trip.html'),
        dashboard: path.resolve(__dirname, 'dashboard.html'),
      },
    },
  },
});
