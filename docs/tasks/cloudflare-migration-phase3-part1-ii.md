# Phase 3 Part 1-ii: Zustand状態管理セットアップ

## フェーズ概要

- **期間**: Day 11-15 (5営業日)
- **総工数**: 40時間
- **目標**: Cloudflare Workers APIに対応したReact フロントエンドの実装完了
- **前提条件**: Phase 2完了 (Cloudflare Workers API、D1 Database実装済み)
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

## Part 1-ii タスク一覧

このPart 1-iiでは、Zustand状態管理の実装を行います。

- **TASK-0034**: Zustand状態管理セットアップ

---

### TASK-0034: Zustand状態管理セットアップ

- [ ] **タスク未着手**
- **推定工数**: 4時間
- **タスクタイプ**: TDD
- **要件**: architecture-cloudflare.md (Zustand状態管理), tech-stack.md (Zustand) 🔵
- **依存タスク**: TASK-0033 (Vite + React 19セットアップ)
- **要件名**: Zustand状態管理ストア実装

#### 実装詳細

1. **Battle Log Store実装**
   - ファイル: `frontend/src/store/battleLogStore.ts`

   ```typescript
   import { create } from 'zustand';
   import type {
     BattleLogStore,
     BattleLogWithDeckNames,
     CreateBattleLogRequest,
     GetBattleLogsRequest,
   } from '../types';
   import { apiClient } from '../api/client';

   export const useBattleLogStore = create<BattleLogStore>((set, get) => ({
     battleLogs: [],
     isLoading: false,
     error: null,
     previousInput: null,

     fetchBattleLogs: async (params?: GetBattleLogsRequest) => {
       set({ isLoading: true, error: null });
       try {
         const queryParams = new URLSearchParams();
         if (params?.period) queryParams.set('period', params.period);
         if (params?.limit) queryParams.set('limit', params.limit.toString());
         if (params?.offset) queryParams.set('offset', params.offset.toString());

         const battleLogs = await apiClient.get<BattleLogWithDeckNames[]>(
           `/battle-logs?${queryParams.toString()}`,
         );

         set({ battleLogs, isLoading: false });
       } catch (error) {
         set({
           error: error instanceof Error ? error.message : 'Unknown error',
           isLoading: false,
         });
       }
     },

     createBattleLog: async (data: CreateBattleLogRequest) => {
       set({ isLoading: true, error: null });
       try {
         const newLog = await apiClient.post<BattleLogWithDeckNames>(
           '/battle-logs',
           data,
         );

         const { battleLogs } = get();
         set({
           battleLogs: [newLog, ...battleLogs],
           isLoading: false,
           previousInput: data,
         });
       } catch (error) {
         set({
           error: error instanceof Error ? error.message : 'Unknown error',
           isLoading: false,
         });
         throw error;
       }
     },

     deleteBattleLog: async (id: string) => {
       set({ isLoading: true, error: null });
       try {
         await apiClient.delete(`/battle-logs/${id}`);

         const { battleLogs } = get();
         set({
           battleLogs: battleLogs.filter((log) => log.id !== id),
           isLoading: false,
         });
       } catch (error) {
         set({
           error: error instanceof Error ? error.message : 'Unknown error',
           isLoading: false,
         });
         throw error;
       }
     },

     setPreviousInput: (data: CreateBattleLogRequest) => {
       set({ previousInput: data });
     },
   }));
   ```

2. **Deck Master Store実装**
   - ファイル: `frontend/src/store/deckStore.ts`

   ```typescript
   import { create } from 'zustand';
   import type { DeckStore, DeckMaster } from '../types';
   import { apiClient } from '../api/client';

   export const useDeckStore = create<DeckStore>((set) => ({
     deckMasters: [],
     isLoading: false,
     error: null,

     fetchDeckMasters: async () => {
       set({ isLoading: true, error: null });
       try {
         const deckMasters = await apiClient.get<DeckMaster[]>('/deck-master');
         set({ deckMasters, isLoading: false });
       } catch (error) {
         set({
           error: error instanceof Error ? error.message : 'Unknown error',
           isLoading: false,
         });
       }
     },
   }));
   ```

3. **Statistics Store実装**
   - ファイル: `frontend/src/store/statisticsStore.ts`

   ```typescript
   import { create } from 'zustand';
   import type {
     StatisticsStore,
     StatisticsData,
     GetStatisticsRequest,
   } from '../types';
   import { apiClient } from '../api/client';

   export const useStatisticsStore = create<StatisticsStore>((set) => ({
     statistics: null,
     isLoading: false,
     error: null,
     currentPeriod: '1week',

     fetchStatistics: async (params: GetStatisticsRequest) => {
       set({ isLoading: true, error: null });
       try {
         const queryParams = new URLSearchParams();
         queryParams.set('period', params.period);
         if (params.startDate) queryParams.set('startDate', params.startDate);
         if (params.endDate) queryParams.set('endDate', params.endDate);

         const statistics = await apiClient.get<StatisticsData>(
           `/statistics?${queryParams.toString()}`,
         );

         set({ statistics, isLoading: false, currentPeriod: params.period });
       } catch (error) {
         set({
           error: error instanceof Error ? error.message : 'Unknown error',
           isLoading: false,
         });
       }
     },

     setPeriod: (period: GetStatisticsRequest['period']) => {
       set({ currentPeriod: period });
     },
   }));
   ```

#### テスト要件

1. **Battle Log Store単体テスト**
   - ファイル: `frontend/src/store/battleLogStore.test.ts`

   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { useBattleLogStore } from './battleLogStore';
   import { apiClient } from '../api/client';

   vi.mock('../api/client');

   describe('BattleLogStore', () => {
     beforeEach(() => {
       useBattleLogStore.setState({
         battleLogs: [],
         isLoading: false,
         error: null,
         previousInput: null,
       });
     });

     it('fetchBattleLogs が正しく動作する', async () => {
       const mockLogs = [
         { id: 'log_001', date: '2025-01-01', /* ... */ },
       ];
       vi.mocked(apiClient.get).mockResolvedValueOnce(mockLogs);

       await useBattleLogStore.getState().fetchBattleLogs();

       expect(useBattleLogStore.getState().battleLogs).toEqual(mockLogs);
       expect(useBattleLogStore.getState().isLoading).toBe(false);
     });

     it('createBattleLog が previousInput を保存する', async () => {
       const mockData = {
         date: '2025-01-01',
         battleType: 'ランクマッチ' as const,
         /* ... */
       };
       const mockNewLog = { id: 'log_002', ...mockData };
       vi.mocked(apiClient.post).mockResolvedValueOnce(mockNewLog);

       await useBattleLogStore.getState().createBattleLog(mockData);

       expect(useBattleLogStore.getState().previousInput).toEqual(mockData);
     });
   });
   ```

2. **テストケース一覧**
   - [ ] fetchBattleLogs が正しく動作する
   - [ ] createBattleLog が previousInput を保存する
   - [ ] deleteBattleLog が対戦履歴を削除する
   - [ ] エラー時にエラーメッセージが設定される
   - [ ] fetchDeckMasters が正しく動作する
   - [ ] fetchStatistics が正しく動作する

#### 完了条件

- [ ] Battle Log Store が実装されている
- [ ] Deck Master Store が実装されている
- [ ] Statistics Store が実装されている
- [ ] すべてのストアアクションが正しく動作する
- [ ] エラーハンドリングが正しく動作する
- [ ] 単体テストが100%成功する (6ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

#### 実行コマンド

```bash
/tsumiki:tdd-requirements TASK-0034
/tsumiki:tdd-testcases
/tsumiki:tdd-red
/tsumiki:tdd-green
/tsumiki:tdd-refactor
/tsumiki:tdd-verify-complete TASK-0034
```

---

## Part 1 完了条件

- [ ] TASK-0033 (Vite + React 19 セットアップ) が完了している
- [ ] TASK-0034 (Zustand状態管理セットアップ) が完了している
- [ ] Vite + React 19プロジェクトが動作している
- [ ] Zustand Storesが正しく動作している
- [ ] すべての単体テストが成功している
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

## 次のステップ

Part 2では以下のタスクを実行します:
- **TASK-0035**: API接続の更新
- **TASK-0036**: 対戦履歴UI実装
- **TASK-0037**: 統計ダッシュボード実装
- **TASK-0038**: レスポンシブ対応・E2Eテスト

---

## 更新履歴

- **2025-11-26**: Phase 3 Part 1-ii作成
  - Zustand状態管理セットアップ

---

**ドキュメント終了**
