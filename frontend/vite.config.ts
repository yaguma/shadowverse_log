import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
/**
 * Vite Configuration
 *
 * TASK-0041: パフォーマンス最適化
 * - manualChunks設定でバンドル分割
 * - 初期ロード時間を短縮
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        /**
         * バンドル分割設定
         *
         * vendor: React コアライブラリ（頻繁に更新されない）
         * store: 状態管理ライブラリ
         * charts: グラフライブラリ（統計ページでのみ使用）
         */
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
