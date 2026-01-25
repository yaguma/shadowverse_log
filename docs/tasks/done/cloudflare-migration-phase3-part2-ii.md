# Phase 3 Part 2-ii: 統計ダッシュボード & レスポンシブ対応・E2Eテスト

## フェーズ概要

- **期間**: Day 11-15 (5営業日)
- **総工数**: 40時間
- **目標**: Cloudflare Workers APIに対応したReact フロントエンドの実装完了
- **前提条件**: Phase 2完了 (Cloudflare Workers API、D1 Database実装済み)、Phase 3 Part 1完了 (Vite + React 19, Zustand)
- **成果物**:
  - Vite + React 19プロジェクト
  - Cloudflare Workers APIへの接続
  - 対戦履歴登録・一覧表示
  - 統計ダッシュボード
  - レスポンシブUI (PC/モバイル)
  - E2Eテスト

## 週次計画

### Week 3 (Day 11-13)

- **目標**: React基盤、状態管理、API接続、対戦履歴UI実装
- **成果物**: 対戦履歴登録・一覧機能が動作

### Week 3 後半 (Day 14-15)

- **目標**: 統計ダッシュボード、レスポンシブ対応、E2Eテスト
- **成果物**: すべてのフロントエンド機能が完成

## Part 2-ii タスク一覧

このPart 2-iiでは、統計ダッシュボード実装とレスポンシブ対応・E2Eテストを行います。

- **TASK-0037**: 統計ダッシュボード実装
- **TASK-0038**: レスポンシブ対応・E2Eテスト

---

### TASK-0037: 統計ダッシュボード実装

- [x] **タスク完了**
- **推定工数**: 10時間
- **タスクタイプ**: TDD
- **要件**: REQ-201 (Dashboard表示), REQ-202 (期間選択), REQ-203 (統計情報), REQ-204 (グラフ表示) 🔵
- **依存タスク**: TASK-0035 (API接続)
- **要件名**: 統計ダッシュボードUI

#### 実装詳細

1. **全体統計表示**
   - ファイル: `frontend/src/components/statistics/OverallStats.tsx`
   - 総対戦数、勝利数、敗北数
   - 全体勝率
   - カード形式の表示

2. **デッキ別統計グラフ (Recharts)**
   - ファイル: `frontend/src/components/statistics/OpponentDeckPieChart.tsx`
   - Recharts 円グラフ
   - 対戦相手デッキ分布
   - ツールチップ、凡例表示

3. **ランク別統計グラフ**
   - ファイル: `frontend/src/components/statistics/RankStatsTable.tsx`
   - ランク帯別統計テーブル
   - 対戦数、勝率表示

4. **期間フィルター**
   - ファイル: `frontend/src/components/statistics/PeriodSelector.tsx`
   - デフォルト: 過去7日間
   - 選択肢: 7日間、30日間、90日間、カスタム
   - カスタム期間の日付入力

#### テスト要件

1. **コンポーネントテスト**
   - ファイル: `frontend/src/components/statistics/OverallStats.test.tsx`

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { OverallStats } from './OverallStats';

   describe('OverallStats', () => {
     it('全体統計が正しく表示される', () => {
       const mockStats = {
         totalGames: 100,
         wins: 60,
         losses: 40,
         winRate: 60.0,
       };

       render(<OverallStats stats={mockStats} />);

       expect(screen.getByText('総対戦数')).toBeInTheDocument();
       expect(screen.getByText('100')).toBeInTheDocument();
       expect(screen.getByText('60.0%')).toBeInTheDocument();
     });
   });
   ```

2. **テストケース一覧**
   - [x] 全体統計が正しく表示される
   - [x] デッキ別統計グラフが表示される
   - [x] ランク別統計が表示される
   - [x] 期間選択が動作する
   - [x] カスタム期間が設定できる
   - [x] ローディング状態が表示される
   - [x] エラー状態が表示される
   - [x] 空データ状態が表示される

#### 完了条件

- [x] OverallStats コンポーネントが実装されている
- [x] OpponentDeckPieChart コンポーネントが実装されている
- [x] RankStatsTable コンポーネントが実装されている
- [x] PeriodSelector コンポーネントが実装されている
- [x] 期間選択が動作する
- [x] グラフが正しく表示される
- [x] コンポーネントテストが100%成功する (25ケース)
- [x] レスポンシブデザインが動作する
- [x] Biome lintエラーが0件 (TASK-0037関連)
- [x] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements TASK-0037
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete TASK-0037
```

---

### TASK-0038: レスポンシブ対応・E2Eテスト

- [x] **タスク完了**
- **推定工数**: 4時間
- **タスクタイプ**: TDD
- **要件**: architecture-cloudflare.md (レスポンシブUI), NFR-101 (モバイル対応) 🔵
- **依存タスク**: TASK-0036 (対戦履歴UI), TASK-0037 (統計ダッシュボード)
- **要件名**: レスポンシブ対応とE2Eテスト

#### 実装詳細

1. **モバイル対応 (Tailwind CSS)**
   - ブレークポイント: `sm:640px`, `md:768px`, `lg:1024px`
   - モバイル: カード形式表示
   - PC: テーブル形式表示

2. **PC対応**
   - デスクトップレイアウト
   - テーブル形式の一覧表示
   - マルチカラムレイアウト

3. **Playwright E2Eテスト**
   - ファイル: `frontend/tests/e2e/battle-log.spec.ts`

   ```typescript
   import { test, expect } from '@playwright/test';

   test('対戦履歴を登録できる', async ({ page }) => {
     await page.goto('http://localhost:5173');

     // 登録ボタンをクリック
     await page.click('text=新規登録');

     // フォーム入力
     await page.fill('input[name="date"]', '2025-01-24');
     await page.selectOption('select[name="battleType"]', 'ランクマッチ');
     await page.selectOption('select[name="rank"]', 'ダイアモンド');
     await page.selectOption('select[name="group"]', 'AAA');
     await page.selectOption('select[name="myDeckId"]', 'deck_001');
     await page.check('input[value="先行"]');
     await page.check('input[value="WIN"]');
     await page.selectOption('select[name="opponentDeckId"]', 'deck_master_001');

     // 登録ボタンクリック
     await page.click('text=登録');

     // 成功メッセージ確認
     await expect(page.locator('text=登録しました')).toBeVisible();
   });

   test('対戦履歴一覧が表示される', async ({ page }) => {
     await page.goto('http://localhost:5173');

     // 一覧表示確認
     await expect(page.locator('table')).toBeVisible();
   });
   ```

4. **Playwright設定**
   - ファイル: `frontend/playwright.config.ts`

   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './tests/e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:5173',
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
       {
         name: 'Mobile Chrome',
         use: { ...devices['Pixel 5'] },
       },
     ],
   });
   ```

#### テスト要件

1. **E2Eテストケース一覧**
   - [x] 対戦履歴ページが表示される (TC-E2E-BL-001)
   - [x] 対戦履歴登録フォームが開く (TC-E2E-BL-002)
   - [x] フォームをキャンセルで閉じられる (TC-E2E-BL-003)
   - [x] 空データメッセージが表示される (TC-E2E-BL-004)
   - [x] 統計ダッシュボードが表示される (TC-E2E-ST-001)
   - [x] 期間選択フォームが操作できる (TC-E2E-ST-002)
   - [x] モバイル表示が正しく動作する (TC-E2E-RESP-001)
   - [x] PC表示が正しく動作する (TC-E2E-RESP-002)
   - [x] 統計ダッシュボードがモバイルでレスポンシブに表示される (TC-E2E-RESP-003)
   - [x] ナビゲーションがモバイルで動作する (TC-E2E-RESP-004)

#### 完了条件

- [x] モバイル対応が実装されている
- [x] PC対応が実装されている
- [x] Playwright E2Eテストが実装されている (10ケース以上)
- [x] E2Eテストファイルにlintエラーが0件
- [x] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements TASK-0038
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete TASK-0038
```

---

## フェーズ完了条件

- [ ] すべてのタスクが完了している
- [ ] Vite + React 19プロジェクトが動作している
- [ ] Cloudflare Workers APIへの接続が動作している
- [ ] 対戦履歴登録・一覧表示が動作している
- [ ] 統計ダッシュボードが動作している
- [ ] レスポンシブデザインが動作する (PC/モバイル)
- [ ] すべての単体テストが成功している
- [ ] すべてのE2Eテストが成功している
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件
- [ ] ページロード時間が3秒以内
- [ ] Lighthouseスコアが85点以上

## 次フェーズへの準備

Phase 4では、Cloudflare Accessによる認証機能の実装と、Cloudflare Pages へのデプロイを行います。

## 技術的な注意点

### Cloudflare Workers API接続

- **エンドポイント**: `https://your-worker.your-subdomain.workers.dev/api`
- **CORS設定**: Cloudflare Workers側で適切に設定済み
- **エラーハンドリング**: Fetch API のネットワークエラーに対応

### Cloudflare Pages デプロイ

- **ビルドコマンド**: `pnpm build`
- **出力ディレクトリ**: `dist/`
- **環境変数**: Cloudflare Pages の環境変数で設定

### パフォーマンス最適化

- **コード分割**: React.lazy() でページごとに分割
- **画像最適化**: Cloudflare Images (Phase 4)
- **CDN配信**: Cloudflare Pages の自動CDN

---

## 更新履歴

- **2025-11-26**: Phase 3 Part 2-ii作成
  - 統計ダッシュボード実装
  - レスポンシブ対応・E2Eテスト

---

**ドキュメント終了**
