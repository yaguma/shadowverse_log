# TASK-0043: battle-logs ルート実装 - TDD要件定義

## 概要

### タスク情報
- **タスクID**: TASK-0043
- **タスク名**: battle-logs ルート実装
- **要件名**: cloudflare-api-gaps
- **推定工数**: 2時間
- **タスクタイプ**: TDD

### 信頼性レベル
- 🔵 **青信号**: `/workers/src/routes/battle-logs.ts` の仕様に基づく

## 背景・目的

既存の `/workers/src/routes/battle-logs.ts` のAPIエンドポイントを `/backend/src/routes/battle-logs.ts` に移植し、Cloudflare Workers統合を完了させる。

## 機能要件

### FR-001: GET /api/battle-logs - 対戦履歴一覧取得 🔵

**説明**: 対戦履歴の一覧をページネーション付きで取得する

**クエリパラメータ**:
| パラメータ | 型 | デフォルト | 制約 | 説明 |
|-----------|------|-----------|------|------|
| limit | number | 100 | 1-1000 | 取得件数 |
| offset | number | 0 | >= 0 | スキップ件数 |
| sortBy | string | "date" | - | ソートフィールド |
| sortOrder | string | "desc" | "asc" \| "desc" | ソート順 |

**レスポンス形式**:
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

### FR-002: POST /api/battle-logs - 対戦履歴新規作成 🔵

**説明**: 新しい対戦履歴を登録する

**リクエストボディ**:
| フィールド | 型 | 必須 | 説明 |
|-----------|------|------|------|
| date | string | ✓ | 対戦日（YYYY-MM-DD形式） |
| battleType | string | ✓ | 対戦タイプ |
| rank | string | - | ランク |
| group | string | - | グループ |
| myDeckId | string | ✓ | 自分のデッキID |
| turn | string | ✓ | 先攻/後攻 |
| result | string | ✓ | 勝敗結果 |
| opponentDeckId | string | - | 相手のデッキID |

**バリデーション**:
- Zodスキーマによるバリデーション
- 不正な入力時は400エラーを返す

**レスポンス**:
- 成功時: 201 Created
- バリデーションエラー時: 400 Bad Request

### FR-003: DELETE /api/battle-logs/:id - 対戦履歴削除 🔵

**説明**: 指定したIDの対戦履歴を削除する

**パスパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|------|------|
| id | string | 対戦履歴ID |

**レスポンス**:
- 成功時: 200 OK
- 存在しないID: 404 Not Found

## 非機能要件

### NFR-001: エラーレスポンス形式 🔵

すべてのエラーは以下の形式で返す:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  },
  "meta": {
    "timestamp": "2025-12-03T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### NFR-002: TypeScript型安全性 🔵

- 厳密なTypeScript型定義
- `any`型の使用禁止
- Biome lint通過必須

### NFR-003: 既存パターンとの一貫性 🔵

- 既存の `statistics.ts` ルートのパターンに従う
- `createDb` 関数を使用してデータベース接続
- `BattleLogsRepository` を使用してデータアクセス

## 受け入れ基準

### AC-001: GET エンドポイントが正常動作する
- [ ] GET /api/battle-logs が200を返す
- [ ] ページネーションパラメータが正しく動作する
- [ ] レスポンス形式が仕様に準拠している

### AC-002: POST エンドポイントが正常動作する
- [ ] POST /api/battle-logs が201を返す（正常時）
- [ ] バリデーションエラー時に400を返す
- [ ] 作成されたレコードがレスポンスに含まれる

### AC-003: DELETE エンドポイントが正常動作する
- [ ] DELETE /api/battle-logs/:id が200を返す（正常時）
- [ ] 存在しないIDの場合404を返す

### AC-004: 品質基準を満たす
- [ ] TypeScript型エラーなし
- [ ] Biome lint通過
- [ ] 既存テストに影響なし

## 参照ドキュメント

- [タスクファイル](../../tasks/cloudflare-api-gaps-phase1.md)
- [既存workers実装](../../../../workers/src/routes/battle-logs.ts)
- [既存バックエンドルート例](../../../../backend/src/routes/statistics.ts)
- [リポジトリ実装](../../../../backend/src/db/repositories/battle-logs-repository.ts)
