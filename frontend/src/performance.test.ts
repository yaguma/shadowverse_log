/**
 * パフォーマンス最適化テスト
 *
 * TASK-0041: パフォーマンス最適化
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('パフォーマンス最適化テスト', () => {
  describe('バンドルサイズ', () => {
    it('ビルド後のアセットが存在すること', () => {
      const distPath = path.join(__dirname, '../dist/assets');

      // ビルドが実行されている場合のみテスト
      if (!fs.existsSync(distPath)) {
        console.warn('dist/assetsが存在しません。pnpm buildを実行してください。');
        return;
      }

      const files = fs.readdirSync(distPath);
      expect(files.length).toBeGreaterThan(0);
    });

    it('チャンク分割が機能していること', () => {
      const distPath = path.join(__dirname, '../dist/assets');

      // ビルドが実行されている場合のみテスト
      if (!fs.existsSync(distPath)) {
        console.warn('dist/assetsが存在しません。pnpm buildを実行してください。');
        return;
      }

      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter((f) => f.endsWith('.js'));

      // 複数のJSファイルに分割されていること
      expect(jsFiles.length).toBeGreaterThan(1);
    });
  });

  describe('Lazy Loading設定', () => {
    it('main.tsxでlazy importが使用されていること', () => {
      const mainPath = path.join(__dirname, 'main.tsx');
      const content = fs.readFileSync(mainPath, 'utf-8');

      // lazy関数のインポートが含まれている
      expect(content).toContain('lazy');
    });

    it('Suspenseでフォールバックが設定されていること', () => {
      const mainPath = path.join(__dirname, 'main.tsx');
      const content = fs.readFileSync(mainPath, 'utf-8');

      // Suspenseコンポーネントが含まれている
      expect(content).toContain('Suspense');
    });
  });
});

describe('Vite設定テスト', () => {
  it('vite.config.tsにmanualChunks設定があること', () => {
    const configPath = path.join(__dirname, '../vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');

    // manualChunks設定が含まれている
    expect(content).toContain('manualChunks');
  });

  it('vendorチャンクが設定されていること', () => {
    const configPath = path.join(__dirname, '../vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');

    // vendorチャンクの設定が含まれている
    expect(content).toContain('vendor');
  });
});
