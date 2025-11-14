import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
    sourcemap: false,
  },
});

swa deploy ./frontend/dist/ --api-location ./backend/dist --deployment-token 2dcaa67b95773f21519a4f0c9c72f942c5393a94345075452a9be270bca613db01-15bf5731-d6d8-4f3c-a05a-3059200ae80b00002130ff7f5d00