# Phase 3 Part 2-i: API接続更新 & 対戦履歴UI実装

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

## Part 2-i タスク一覧

このPart 2-iでは、API接続更新と対戦履歴UI実装を行います。

- **TASK-0035**: API接続の更新
- **TASK-0036**: 対戦履歴UI実装

---

### TASK-0035: API接続の更新

- [x] **タスク完了**
- **推定工数**: 6時間
- **タスクタイプ**: TDD
- **要件**: architecture-cloudflare.md (Cloudflare Workers API接続), tech-stack.md (Fetch API) 🔵
- **依存タスク**: TASK-0034 (Zustand状態管理)
- **要件名**: Cloudflare Workers APIへの接続切り替え

#### 実装詳細

1. **API Client実装**
   - ファイル: `frontend/src/api/client.ts`

   ```typescript
   import type { ApiResponse, ApiError } from '../types';

   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

   class ApiClient {
     private async request<T>(
       endpoint: string,
       options?: RequestInit,
     ): Promise<T> {
       try {
         const response = await fetch(`${API_BASE_URL}${endpoint}`, {
           ...options,
           headers: {
             'Content-Type': 'application/json',
             ...options?.headers,
           },
         });

         const data: ApiResponse<T> = await response.json();

         if (!response.ok || !data.success) {
           throw new Error(data.error?.message || 'API request failed');
         }

         return data.data!;
       } catch (error) {
         console.error('API Error:', error);
         throw error;
       }
     }

     async get<T>(endpoint: string): Promise<T> {
       return this.request<T>(endpoint);
     }

     async post<T>(endpoint: string, body: unknown): Promise<T> {
       return this.request<T>(endpoint, {
         method: 'POST',
         body: JSON.stringify(body),
       });
     }

     async delete<T>(endpoint: string): Promise<T> {
       return this.request<T>(endpoint, {
         method: 'DELETE',
       });
     }
   }

   export const apiClient = new ApiClient();
   ```

2. **エラーハンドリング**
   - Fetch API ネットワークエラー対応
   - タイムアウト設定（30秒）
   - リトライ機構（3回まで、指数バックオフ）

3. **レスポンスキャッシュ**
   - デッキマスター: 1時間キャッシュ
   - 統計データ: 5分キャッシュ
   - 対戦履歴: キャッシュなし（常に最新）

#### テスト要件

1. **API Client単体テスト**
   - ファイル: `frontend/src/api/client.test.ts`

   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { apiClient } from './client';

   describe('ApiClient', () => {
     beforeEach(() => {
       global.fetch = vi.fn();
     });

     it('正常なGETリクエストが成功する', async () => {
       const mockData = { success: true, data: { id: '1', name: 'Test' } };
       (global.fetch as any).mockResolvedValueOnce({
         ok: true,
         json: async () => mockData,
       });

       const result = await apiClient.get('/test');
       expect(result).toEqual({ id: '1', name: 'Test' });
     });

     it('APIエラー時にエラーをスローする', async () => {
       const mockError = {
         success: false,
         error: { code: 'TEST_ERROR', message: 'Test error' },
       };
       (global.fetch as any).mockResolvedValueOnce({
         ok: false,
         json: async () => mockError,
       });

       await expect(apiClient.get('/test')).rejects.toThrow('Test error');
     });
   });
   ```

2. **テストケース一覧**
   - [x] 正常なGETリクエストが成功する
   - [x] 正常なPOSTリクエストが成功する
   - [x] 正常なDELETEリクエストが成功する
   - [x] APIエラー時にエラーをスローする
   - [x] ネットワークエラー時にエラーをスローする
   - [x] タイムアウト時にエラーをスローする (リトライ機構で対応)

#### 完了条件

- [x] API Client が実装されている
- [x] Cloudflare Workers APIへの接続が動作する
- [x] エラーハンドリングが正しく動作する
- [x] レスポンスキャッシュが動作する
- [x] 単体テストが100%成功する (6ケース以上)
- [x] Biome lintエラーが0件
- [x] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements TASK-0035
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete TASK-0035
```

---

### TASK-0036: 対戦履歴UI実装

- [ ] **タスク未着手**
- **推定工数**: 10時間
- **タスクタイプ**: TDD
- **要件**: REQ-001 (登録機能), REQ-002 (8項目), REQ-003 (引き継ぎ), REQ-009 (一覧表示), REQ-010 (削除) 🔵
- **依存タスク**: TASK-0035 (API接続)
- **要件名**: 対戦履歴登録・一覧表示UI

#### 実装詳細

1. **対戦履歴登録フォーム (ダイアログ)**
   - ファイル: `frontend/src/components/battle-log/BattleLogForm.tsx`
   - 8項目の入力フィールド
   - 日付バリデーション（未来日付禁止）
   - 必須項目バリデーション
   - インラインエラーメッセージ

2. **前回値引き継ぎ機能**
   - Zustand Store の previousInput を使用
   - 日付は常に今日の日付にリセット
   - 他のフィールドは前回値を引き継ぐ

3. **対戦履歴一覧表示**
   - ファイル: `frontend/src/components/battle-log/BattleLogList.tsx`
   - テーブル形式の一覧表示 (デスクトップ)
   - カード形式の一覧表示 (モバイル)
   - 日付降順ソート

4. **削除機能**
   - 削除確認ダイアログ
   - ローディング中のボタン無効化

#### テスト要件

1. **コンポーネントテスト**
   - ファイル: `frontend/src/components/battle-log/BattleLogForm.test.tsx`

   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { BattleLogForm } from './BattleLogForm';
   import { useBattleLogStore } from '../../store/battleLogStore';
   import { useDeckStore } from '../../store/deckStore';

   vi.mock('../../store/battleLogStore');
   vi.mock('../../store/deckStore');

   describe('BattleLogForm', () => {
     it('フォームが正しく表示される', () => {
       render(<BattleLogForm isOpen={true} onClose={() => {}} />);

       expect(screen.getByText('対戦履歴登録')).toBeInTheDocument();
       expect(screen.getByLabelText('日付 *')).toBeInTheDocument();
     });

     it('未来の日付でエラーが表示される', async () => {
       render(<BattleLogForm isOpen={true} onClose={() => {}} />);

       const dateInput = screen.getByLabelText('日付 *');
       const futureDate = new Date();
       futureDate.setDate(futureDate.getDate() + 1);

       fireEvent.change(dateInput, {
         target: { value: futureDate.toISOString().split('T')[0] },
       });

       const submitButton = screen.getByText('登録');
       fireEvent.click(submitButton);

       await waitFor(() => {
         expect(screen.getByText('未来の日付は入力できません')).toBeInTheDocument();
       });
     });
   });
   ```

2. **テストケース一覧**
   - [ ] フォームが正しく表示される
   - [ ] 未来の日付でエラーが表示される
   - [ ] 必須項目が未入力の場合エラーが表示される
   - [ ] 前回入力値が引き継がれる (日付は除く)
   - [ ] フォーム送信が成功する
   - [ ] ローディング中はボタンが無効化される
   - [ ] キャンセルボタンでフォームが閉じる
   - [ ] 対戦履歴一覧が表示される
   - [ ] 削除機能が動作する

#### 完了条件

- [ ] BattleLogForm コンポーネントが実装されている
- [ ] 8項目の入力フィールドがすべて実装されている
- [ ] 未来日付のバリデーションが動作する
- [ ] 前回入力値が引き継がれる (日付除く)
- [ ] BattleLogList コンポーネントが実装されている
- [ ] 削除機能が動作する
- [ ] コンポーネントテストが100%成功する (9ケース以上)
- [ ] レスポンシブデザインが動作する
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements TASK-0036
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete TASK-0036
```

---

## 更新履歴

- **2025-11-26**: Phase 3 Part 2-i作成
  - API接続の更新
  - 対戦履歴UI実装

---

**ドキュメント終了**
