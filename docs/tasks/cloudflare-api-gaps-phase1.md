# Cloudflare API ギャップ解消 - Phase 1: API実装・統合

## フェーズ概要

- **要件名**: cloudflare-api-gaps
- **期間**: 1日（約5.5時間）
- **目標**: battle-logs と deck-master API を `/backend` に統合
- **成果物**:
  - `backend/src/routes/battle-logs.ts`
  - `backend/src/routes/deck-master.ts`
  - `backend/src/index.ts` の更新

---

## 週次計画

### Day 1: API実装・統合・テスト

| 時間 | タスク | 成果物 |
|------|--------|--------|
| 2h | TASK-0043: battle-logs ルート実装 | `routes/battle-logs.ts` |
| 1h | TASK-0044: deck-master ルート実装 | `routes/deck-master.ts` |
| 0.5h | TASK-0045: index.ts登録 | `index.ts` 更新 |
| 2h | TASK-0046: 統合テスト・動作確認 | テスト通過 |

---

## タスク詳細

### TASK-0043: battle-logs ルート実装

- [x] **タスク完了** (2025-12-03)

| 項目 | 内容 |
|------|------|
| **推定工数** | 2時間 |
| **タスクタイプ** | TDD |
| **依存タスク** | なし（並行実行可能） |
| **要件名** | cloudflare-api-gaps |

#### 要件リンク
- 🔵 青信号: `/workers/src/routes/battle-logs.ts` の仕様に基づく

#### 実装詳細

**作成ファイル**: `backend/src/routes/battle-logs.ts`

**エンドポイント仕様**:

1. **GET /api/battle-logs** - 対戦履歴一覧取得
   - クエリパラメータ:
     - `limit` (default: 100, max: 1000)
     - `offset` (default: 0)
     - `sortBy` (default: "date")
     - `sortOrder` (default: "desc")
   - レスポンス:
     ```json
     {
       "success": true,
       "data": {
         "battleLogs": [...],
         "total": 100,
         "limit": 100,
         "offset": 0
       },
       "meta": {
         "timestamp": "2025-12-03T00:00:00.000Z",
         "requestId": "uuid"
       }
     }
     ```

2. **POST /api/battle-logs** - 対戦履歴新規作成
   - リクエストボディ:
     ```json
     {
       "date": "2025-12-03",
       "battleType": "ランクマッチ",
       "rank": "ダイアモンド",
       "group": "A",
       "myDeckId": "deck-id",
       "turn": "先攻",
       "result": "勝ち",
       "opponentDeckId": "opponent-deck-id"
     }
     ```
   - バリデーション: Zodスキーマ使用
   - レスポンス: 201 Created

3. **DELETE /api/battle-logs/:id** - 対戦履歴削除
   - パスパラメータ: `id`
   - レスポンス: 200 OK または 404 Not Found

**実装パターン**:
```typescript
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { BattleLogsRepository } from '../db/repositories/battle-logs-repository';
import type { Env } from '../index';

const battleLogs = new Hono<{ Bindings: Env }>();

battleLogs.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const repository = new BattleLogsRepository(db);
  // ... 実装
});

export default battleLogs;
```

#### 完了条件

- [x] GET /api/battle-logs が正常動作
- [x] POST /api/battle-logs が正常動作（バリデーション含む）
- [x] DELETE /api/battle-logs/:id が正常動作
- [x] エラーレスポンスが統一フォーマット
- [x] TypeScript型エラーなし
- [x] Biome lint通過

#### テスト要件

- [x] 一覧取得のテスト（ページネーション）
- [x] 新規作成のテスト（正常系・異常系）
- [x] 削除のテスト（存在する/しないID）

#### TDD実行コマンド

```bash
/tdd-requirements TASK-0043
/tdd-testcases TASK-0043
/tdd-red TASK-0043
/tdd-green TASK-0043
/tdd-refactor TASK-0043
/tdd-verify-complete TASK-0043
```

---

### TASK-0044: deck-master ルート実装

- [x] **タスク完了** (2025-12-03)

| 項目 | 内容 |
|------|------|
| **推定工数** | 1時間 |
| **タスクタイプ** | TDD |
| **依存タスク** | なし（並行実行可能） |
| **要件名** | cloudflare-api-gaps |

#### 要件リンク
- 🔵 青信号: `/workers/src/routes/deck-master.ts` の仕様に基づく

#### 実装詳細

**作成ファイル**: `backend/src/routes/deck-master.ts`

**エンドポイント仕様**:

1. **GET /api/deck-master** - デッキマスター一覧取得
   - キャッシュ: `Cache-Control: public, max-age=300` (5分)
   - レスポンス:
     ```json
     {
       "success": true,
       "data": {
         "deckMasters": [
           {
             "id": "...",
             "className": "エルフ",
             "deckName": "妖精エルフ",
             "sortOrder": 1
           }
         ]
       },
       "meta": {
         "timestamp": "2025-12-03T00:00:00.000Z",
         "requestId": "uuid"
       }
     }
     ```

**実装パターン**:
```typescript
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { DeckMasterRepository } from '../db/repositories/deck-master-repository';
import type { Env } from '../index';

const deckMaster = new Hono<{ Bindings: Env }>();

deckMaster.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const repository = new DeckMasterRepository(db);
  const deckMasters = await repository.findAll();

  // Cache-Control設定
  c.header('Cache-Control', 'public, max-age=300');

  return c.json({
    success: true,
    data: { deckMasters },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
});

export default deckMaster;
```

#### 完了条件

- [x] GET /api/deck-master が正常動作
- [x] Cache-Controlヘッダーが設定される
- [x] sortOrder昇順でソートされる
- [x] TypeScript型エラーなし
- [x] Biome lint通過

#### テスト要件

- [x] 一覧取得のテスト
- [x] キャッシュヘッダーのテスト
- [x] 空データ時のテスト

#### TDD実行コマンド

```bash
/tdd-requirements TASK-0044
/tdd-testcases TASK-0044
/tdd-red TASK-0044
/tdd-green TASK-0044
/tdd-refactor TASK-0044
/tdd-verify-complete TASK-0044
```

---

### TASK-0045: index.ts へのルート登録

- [x] **タスク完了** (2025-12-04)

| 項目 | 内容 |
|------|------|
| **推定工数** | 0.5時間 |
| **タスクタイプ** | DIRECT |
| **依存タスク** | TASK-0043, TASK-0044 |
| **要件名** | cloudflare-api-gaps |

#### 要件リンク
- 🔵 青信号: 既存の `backend/src/index.ts` パターンに従う

#### 実装詳細

**更新ファイル**: `backend/src/index.ts`

**変更内容**:

1. インポート追加:
   ```typescript
   import battleLogsRoutes from './routes/battle-logs';
   import deckMasterRoutes from './routes/deck-master';
   ```

2. ルート登録追加:
   ```typescript
   // 対戦履歴APIルート
   app.route('/api/battle-logs', battleLogsRoutes);

   // デッキマスターAPIルート
   app.route('/api/deck-master', deckMasterRoutes);
   ```

3. 認証スキップパスの確認（コメント内）:
   ```typescript
   // skipPaths: [..., '/api/battle-logs', '/api/deck-master', ...]
   ```

#### 完了条件

- [x] battle-logsルートが登録される
- [x] deck-masterルートが登録される
- [x] 既存ルートに影響なし
- [x] TypeScript型エラーなし（TASK-0045範囲のコードに限る）
- [x] Biome lint通過（TASK-0045範囲のコードに限る）

#### DIRECT実行コマンド

```bash
/direct-setup TASK-0045
/direct-verify TASK-0045
```

---

### TASK-0046: 統合テスト・動作確認

- [x] **タスク完了** (2025-12-04)

| 項目 | 内容 |
|------|------|
| **推定工数** | 2時間 |
| **タスクタイプ** | TDD |
| **依存タスク** | TASK-0045 |
| **要件名** | cloudflare-api-gaps |

#### 要件リンク
- 🔵 青信号: 既存テストパターン (`backend/tests/routes/`) に従う

#### 実装詳細

**作成ファイル**:
- `backend/tests/routes/battle-logs.test.ts`
- `backend/tests/routes/deck-master.test.ts`

**テスト項目**:

1. **battle-logs テスト**:
   - GET /api/battle-logs - 一覧取得
   - GET /api/battle-logs?limit=10&offset=5 - ページネーション
   - POST /api/battle-logs - 正常作成
   - POST /api/battle-logs - バリデーションエラー
   - DELETE /api/battle-logs/:id - 正常削除
   - DELETE /api/battle-logs/:id - 存在しないID

2. **deck-master テスト**:
   - GET /api/deck-master - 一覧取得
   - Cache-Controlヘッダー確認

3. **品質確認**:
   - `pnpm run lint` 通過
   - `pnpm run type-check` 通過
   - `pnpm test` 通過

#### 完了条件

- [x] battle-logs テスト全通過
- [x] deck-master テスト全通過
- [x] 既存テストに影響なし
- [x] Biome lint エラーなし
- [x] TypeScript 型エラーなし（TASK-0046範囲のコードに限る）
- [x] ローカル環境で動作確認完了

#### 動作確認コマンド

```bash
# ローカルサーバー起動
cd backend && pnpm run dev

# API動作確認
curl http://localhost:8787/api/battle-logs
curl http://localhost:8787/api/deck-master

# テスト実行
pnpm test

# Lint実行
pnpm run lint

# 型チェック
pnpm run type-check
```

#### TDD実行コマンド

```bash
/tdd-requirements TASK-0046
/tdd-verify-complete TASK-0046
```

---

## チェックポイント

### M1: APIルート実装完了
- [x] TASK-0043 完了
- [x] TASK-0044 完了
- [x] 両ルートファイルが存在

### M2: 統合完了
- [x] TASK-0045 完了
- [x] index.tsに両ルート登録済み
- [x] ローカルサーバーで全API動作確認

### M3: 品質確認完了
- [x] TASK-0046 完了
- [x] 全テスト通過
- [x] Lint通過
- [x] 型チェック通過

---

## 進捗サマリー

| タスク | ステータス | 完了日 |
|--------|-----------|--------|
| TASK-0043: battle-logs ルート実装 | ✅ 完了 | 2025-12-03 |
| TASK-0044: deck-master ルート実装 | ✅ 完了 | 2025-12-03 |
| TASK-0045: index.ts登録 | ✅ 完了 | 2025-12-04 |
| TASK-0046: 統合テスト・動作確認 | ✅ 完了 | 2025-12-04 |

---

## 次のフェーズへの引き継ぎ

Phase 1完了後の推奨作業:

1. `/workers` ディレクトリの整理・削除検討
2. Cloudflare Access 認証の本番有効化（TASK-0039, TASK-0040）
3. Azure関連レガシーファイルの削除
