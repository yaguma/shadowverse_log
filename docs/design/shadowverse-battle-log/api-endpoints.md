# API Endpoints Design

**プロジェクト**: Shadowverse Battle Log
**作成日**: 2025-10-24
**バージョン**: 1.0.0
**対応要件**: REQ-001 ~ REQ-054

---

## 概要

本ドキュメントでは、Shadowverse Battle LogアプリケーションのRESTful APIエンドポイント仕様を定義します。

### API設計原則

- **RESTful設計**: リソース指向のURL構造
- **HTTPメソッド**: GET/POST/PUT/DELETE の適切な使用
- **ステートレス**: 各リクエストは独立して処理可能
- **一貫性のあるレスポンス形式**: 成功/エラーで統一されたフォーマット
- **バージョニング**: 将来の拡張性を考慮（現在はv1）

### 信頼性レベル凡例

- 🔵 **高**: 既存データ構造・ユーザヒアリングより確定
- 🟡 **中**: 推測または一般的なベストプラクティスより
- 🔴 **低**: 要確認・仮定

---

## ベースURL

### Phase 1（単一ユーザー）

```
https://<your-app-name>.azurestaticapps.net/api
```

### Phase 2（マルチユーザー）

```
https://<your-app-name>.azurestaticapps.net/api
```

**認証**: Azure AD B2C Bearer Token

---

## 共通レスポンス形式

### 成功レスポンス 🟡 *一般的なRESTful APIのベストプラクティスより*

```typescript
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "uuid-v4"
  }
}
```

### エラーレスポンス 🟡 *一般的なRESTful APIのベストプラクティスより*

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザーフレンドリーなエラーメッセージ",
    "details": {} // オプション: 詳細情報
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "uuid-v4"
  }
}
```

### HTTPステータスコード 🟡 *RESTful標準より*

| ステータスコード | 用途 |
|---|---|
| 200 OK | 成功（GET, PUT, DELETE） |
| 201 Created | リソース作成成功（POST） |
| 400 Bad Request | リクエストパラメータ不正 |
| 401 Unauthorized | 認証失敗（Phase 2） |
| 403 Forbidden | 権限不足（Phase 2） |
| 404 Not Found | リソースが存在しない |
| 409 Conflict | リソース競合（Phase 2） |
| 500 Internal Server Error | サーバーエラー |
| 503 Service Unavailable | サービス一時停止 |

---

## Phase 1 エンドポイント

### 1. 対戦履歴管理

#### 1.1 対戦履歴一覧取得

**エンドポイント**: `GET /battle-logs`

**説明**: 対戦履歴の一覧を取得 🔵 *REQ-009より*

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `limit` | number | No | 100 | 取得件数（最大1000） | 🔵 *REQ-009より* |
| `offset` | number | No | 0 | スキップ件数 | 🟡 *ページネーション標準より* |
| `sortBy` | string | No | "date" | ソートキー | 🔵 *ユーザヒアリングより* |
| `sortOrder` | "asc" \| "desc" | No | "desc" | ソート順 | 🔵 *ユーザヒアリングより* |

**リクエスト例**:

```http
GET /api/battle-logs?limit=50&sortBy=date&sortOrder=desc
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "battleLogs": [
      {
        "id": "log_20250124_001",
        "date": "2025-01-24",
        "battleType": "ランクマッチ",
        "rank": "ダイアモンド",
        "group": "AAA",
        "myDeckId": "deck_001",
        "turn": "先攻",
        "result": "勝ち",
        "opponentDeckId": "deck_master_002"
      }
    ],
    "total": 84,
    "limit": 50,
    "offset": 0
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**エラーケース**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LIMIT",
    "message": "limitは1から1000の間で指定してください"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 1.2 対戦履歴登録

**エンドポイント**: `POST /battle-logs`

**説明**: 新しい対戦履歴を登録 🔵 *REQ-001, REQ-002より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `date` | string | No | 今日 | 対戦日（YYYY-MM-DD形式） | 🔵 *REQ-002より* |
| `battleType` | BattleType | Yes | - | 対戦タイプ（"ランクマッチ" \| "対戦台" \| "ロビー大会"） | 🔵 *REQ-002より* |
| `rank` | Rank | Yes | - | ランク（"サファイア" \| "ダイアモンド" \| "ルビー" \| "トパーズ" \| "-"） | 🔵 *REQ-002より* |
| `group` | Group | Yes | - | グループ（"A" \| "AA" \| "AAA" \| "Master" \| "-"） | 🔵 *REQ-002より* |
| `myDeckId` | string | Yes | - | 使用デッキID | 🔵 *REQ-002より* |
| `turn` | Turn | Yes | - | 先攻後攻（"先攻" \| "後攻"） | 🔵 *REQ-002より* |
| `result` | BattleResult | Yes | - | 対戦結果（"勝ち" \| "負け"） | 🔵 *REQ-002より* |
| `opponentDeckId` | string | Yes | - | 相手デッキID | 🔵 *REQ-002より* |

**TypeScript型定義**:

```typescript
{
  "date": string;           // YYYY-MM-DD形式
  "battleType": BattleType;
  "rank": Rank;
  "group": Group;
  "myDeckId": string;
  "turn": Turn;
  "result": BattleResult;
  "opponentDeckId": string;
}
```

**リクエスト例**:

```http
POST /api/battle-logs
Content-Type: application/json

{
  "date": "2025-01-24",
  "battleType": "ランクマッチ",
  "rank": "ダイアモンド",
  "group": "AAA",
  "myDeckId": "deck_001",
  "turn": "先攻",
  "result": "勝ち",
  "opponentDeckId": "deck_master_002"
}
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "battleLog": {
      "id": "log_20250124_085",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AAA",
      "myDeckId": "deck_001",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "deck_master_002"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**バリデーションエラー例**: 🔵 *REQ-030より*

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": {
      "date": "未来の日付は入力できません",
      "myDeckId": "存在しないデッキIDです"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 1.3 対戦履歴削除

**エンドポイント**: `DELETE /battle-logs/{id}`

**説明**: 指定した対戦履歴を削除 🔵 *REQ-010より*

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|---|---|---|
| `id` | string | 削除対象の対戦履歴ID |

**リクエスト例**:

```http
DELETE /api/battle-logs/log_20250124_001
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "deletedId": "log_20250124_001"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**エラーケース（存在しないID）**:

```json
{
  "success": false,
  "error": {
    "code": "BATTLE_LOG_NOT_FOUND",
    "message": "指定された対戦履歴が見つかりません"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 1.4 対戦履歴詳細取得

**エンドポイント**: `GET /battle-logs/{id}`

**説明**: 指定した対戦履歴の詳細情報を取得 🔵 *REQ-011より*

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|---|---|---|
| `id` | string | 取得対象の対戦履歴ID |

**リクエスト例**:

```http
GET /api/battle-logs/log_20250124_001
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "battleLog": {
      "id": "log_20250124_001",
      "date": "2025-01-24",
      "battleType": "ランクマッチ",
      "rank": "ダイアモンド",
      "group": "AAA",
      "myDeckId": "deck_001",
      "myDeckName": "秘術オデンスペル",
      "turn": "先攻",
      "result": "勝ち",
      "opponentDeckId": "deck_master_002",
      "opponentDeckName": "進化ネクロ"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

### 2. 統計・分析

#### 2.1 統計データ取得

**エンドポイント**: `GET /statistics`

**説明**: 対戦履歴の統計データを取得 🔵 *REQ-014, REQ-015, REQ-016, REQ-017より*

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `startDate` | string | No | 7日前 | 集計開始日（YYYY-MM-DD） |
| `endDate` | string | No | 今日 | 集計終了日（YYYY-MM-DD） |
| `battleType` | string | No | 全て | 対戦タイプ絞り込み |

**リクエスト例**:

```http
GET /api/statistics?startDate=2025-01-01&endDate=2025-01-24&battleType=ランクマッチ
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "overall": {
      "totalGames": 84,
      "wins": 52,
      "losses": 32,
      "winRate": 61.9
    },
    "byMyDeck": [
      {
        "deckId": "deck_001",
        "deckName": "秘術オデンスペル",
        "totalGames": 84,
        "wins": 52,
        "losses": 32,
        "winRate": 61.9
      }
    ],
    "byOpponentDeck": [
      {
        "deckId": "deck_master_002",
        "deckName": "進化ネクロ",
        "totalGames": 15,
        "wins": 8,
        "losses": 7,
        "winRate": 53.3
      }
    ],
    "byRank": [
      {
        "rank": "ダイアモンド",
        "group": "AAA",
        "totalGames": 50,
        "wins": 30,
        "losses": 20,
        "winRate": 60.0
      }
    ],
    "byTurn": {
      "先攻": {
        "totalGames": 42,
        "wins": 26,
        "losses": 16,
        "winRate": 61.9
      },
      "後攻": {
        "totalGames": 42,
        "wins": 26,
        "losses": 16,
        "winRate": 61.9
      }
    },
    "opponentDeckDistribution": [
      {
        "deckId": "deck_master_002",
        "deckName": "進化ネクロ",
        "count": 15,
        "percentage": 17.9
      }
    ],
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-24"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

### 3. マスターデータ

#### 3.1 デッキマスター一覧取得

**エンドポイント**: `GET /deck-master`

**説明**: デッキマスター（相手デッキ選択肢）の一覧を取得 🔵 *REQ-002より*

**リクエスト例**:

```http
GET /api/deck-master
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "deckMaster": [
      {
        "id": "deck_master_001",
        "deckName": "進化ロイヤル"
      },
      {
        "id": "deck_master_002",
        "deckName": "進化ネクロ"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

### 4. データインポート

#### 4.1 データインポート

**エンドポイント**: `POST /import`

**説明**: JSON/CSV形式のデータをインポート 🔵 *REQ-035より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `format` | string | Yes | - | データフォーマット（"json" \| "csv"） | 🔵 *REQ-035より* |
| `data` | string | Yes | - | インポートするデータ（JSON文字列またはCSV文字列） | 🔵 *REQ-035より* |

**TypeScript型定義**:

```typescript
{
  "format": "json" | "csv";
  "data": string; // JSON文字列 or CSV文字列
}
```

**リクエスト例（JSON）**:

```http
POST /api/import
Content-Type: application/json

{
  "format": "json",
  "data": "[{\"id\":\"log_001\",\"date\":\"2025-01-01\",...}]"
}
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "imported": 10,
    "skipped": 2,
    "errors": 0,
    "details": {
      "skippedIds": ["log_001", "log_002"],
      "reason": "既に存在するIDのため"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**エラーケース（フォーマットエラー）**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FORMAT",
    "message": "インポートデータのフォーマットが不正です",
    "details": {
      "line": 5,
      "error": "dateフィールドが不正です"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

## Phase 2 エンドポイント

### 認証ヘッダー 🔵 *REQ-022より*

Phase 2の全エンドポイントは以下のヘッダーが必須:

```http
Authorization: Bearer <Azure AD B2C Token>
```

### 5. マイデッキ管理

#### 5.1 マイデッキ一覧取得

**エンドポイント**: `GET /my-decks`

**説明**: ログインユーザーのマイデッキ一覧を取得 🔵 *REQ-040より*

**リクエスト例**:

```http
GET /api/my-decks
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "myDecks": [
      {
        "id": "deck_001",
        "deckId": "deck_001",
        "deckCode": "3.1.3.1.3.1...",
        "deckName": "秘術オデンスペル",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 5.2 マイデッキ登録

**エンドポイント**: `POST /my-decks`

**説明**: 新しいマイデッキを登録 🔵 *REQ-040より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `deckCode` | string | Yes | - | デッキコード | 🔵 *REQ-040より* |
| `deckName` | string | Yes | - | デッキ名 | 🔵 *REQ-040より* |
| `isActive` | boolean | No | true | 使用中フラグ | 🔵 *REQ-040より* |

**TypeScript型定義**:

```typescript
{
  "deckCode": string;
  "deckName": string;
  "isActive": boolean;
}
```

**リクエスト例**:

```http
POST /api/my-decks
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "deckCode": "3.1.3.1.3.1...",
  "deckName": "進化ロイヤル",
  "isActive": true
}
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "myDeck": {
      "id": "deck_002",
      "deckId": "deck_002",
      "deckCode": "3.1.3.1.3.1...",
      "deckName": "進化ロイヤル",
      "isActive": true,
      "createdAt": "2025-10-24T12:34:56.789Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 5.3 マイデッキ更新

**エンドポイント**: `PUT /my-decks/{id}`

**説明**: マイデッキ情報を更新 🔵 *REQ-041より*

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|---|---|---|
| `id` | string | 更新対象のデッキID |

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `deckCode` | string | No | - | デッキコード | 🔵 *REQ-041より* |
| `deckName` | string | No | - | デッキ名 | 🔵 *REQ-041より* |
| `isActive` | boolean | No | - | 使用中フラグ | 🔵 *REQ-041より* |

**TypeScript型定義**:

```typescript
{
  "deckCode"?: string;
  "deckName"?: string;
  "isActive"?: boolean;
}
```

**リクエスト例**:

```http
PUT /api/my-decks/deck_001
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "deckName": "秘術オデンスペル v2",
  "isActive": false
}
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "myDeck": {
      "id": "deck_001",
      "deckId": "deck_001",
      "deckCode": "3.1.3.1.3.1...",
      "deckName": "秘術オデンスペル v2",
      "isActive": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

#### 5.4 マイデッキ削除

**エンドポイント**: `DELETE /my-decks/{id}`

**説明**: マイデッキを削除 🔵 *REQ-042より*

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|---|---|---|
| `id` | string | 削除対象のデッキID |

**リクエスト例**:

```http
DELETE /api/my-decks/deck_001
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "deletedId": "deck_001"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**エラーケース（使用中のデッキ）**: 🔵 *REQ-043より*

```json
{
  "success": false,
  "error": {
    "code": "DECK_IN_USE",
    "message": "このデッキは対戦履歴で使用されているため削除できません",
    "details": {
      "usageCount": 84
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

### 6. データエクスポート

#### 6.1 データエクスポート

**エンドポイント**: `POST /export`

**説明**: 対戦履歴をJSON/CSV形式でエクスポート 🔵 *REQ-036より*

**リクエストボディ**:

| パラメータ | 型 | 必須 | デフォルト値 | 説明 | 信頼性 |
|---|---|---|---|---|---|
| `format` | string | Yes | - | エクスポート形式（"json" \| "csv"） | 🔵 *REQ-036より* |
| `startDate` | string | No | 全期間の開始 | 集計開始日（YYYY-MM-DD形式） | 🔵 *REQ-036より* |
| `endDate` | string | No | 今日 | 集計終了日（YYYY-MM-DD形式） | 🔵 *REQ-036より* |
| `battleType` | BattleType | No | 全タイプ | 対戦タイプ絞り込み | 🔵 *REQ-036より* |

**TypeScript型定義**:

```typescript
{
  "format": "json" | "csv";
  "startDate"?: string;
  "endDate"?: string;
  "battleType"?: BattleType;
}
```

**リクエスト例**:

```http
POST /api/export
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "format": "csv",
  "startDate": "2025-01-01",
  "endDate": "2025-01-24"
}
```

**レスポンス例（JSON形式）**:

```json
{
  "success": true,
  "data": {
    "format": "json",
    "content": "[{\"id\":\"log_001\",\"date\":\"2025-01-01\",...}]",
    "fileName": "battle-logs-20250124.json",
    "recordCount": 84
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**レスポンス例（CSV形式）**:

```json
{
  "success": true,
  "data": {
    "format": "csv",
    "content": "id,date,battleType,rank,group,...\nlog_001,2025-01-01,...",
    "fileName": "battle-logs-20250124.csv",
    "recordCount": 84
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

### 7. 認証関連

#### 7.1 トークン検証

**エンドポイント**: `GET /auth/verify`

**説明**: Azure AD B2Cトークンの有効性を検証 🟡 *認証システムの一般的なパターンより*

**リクエスト例**:

```http
GET /api/auth/verify
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**レスポンス例**:

```json
{
  "success": true,
  "data": {
    "userId": "user_abc123",
    "email": "user@example.com",
    "isValid": true,
    "expiresAt": "2025-10-24T14:34:56.789Z"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**エラーケース（無効なトークン）**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "認証トークンが無効です"
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

---

## エラーコード一覧

### 共通エラー 🟡 *一般的なAPIエラーハンドリングパターンより*

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `INTERNAL_SERVER_ERROR` | 500 | サーバー内部エラー |
| `SERVICE_UNAVAILABLE` | 503 | サービス一時停止 |
| `INVALID_REQUEST` | 400 | リクエスト形式不正 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `UNAUTHORIZED` | 401 | 認証失敗 |
| `FORBIDDEN` | 403 | 権限不足 |
| `NOT_FOUND` | 404 | リソースが存在しない |

### 対戦履歴関連エラー 🔵 *要件より*

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `BATTLE_LOG_NOT_FOUND` | 404 | 対戦履歴が存在しない |
| `INVALID_DATE` | 400 | 日付形式不正 |
| `FUTURE_DATE_NOT_ALLOWED` | 400 | 未来の日付は入力不可 |
| `INVALID_BATTLE_TYPE` | 400 | 対戦タイプ不正 |
| `INVALID_RANK` | 400 | ランク不正 |
| `INVALID_GROUP` | 400 | グループ不正 |
| `INVALID_LIMIT` | 400 | limit値が範囲外（1-1000） |

### マイデッキ関連エラー 🔵 *REQ-043より*

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `DECK_NOT_FOUND` | 404 | デッキが存在しない |
| `DECK_IN_USE` | 409 | デッキが使用中で削除不可 |
| `INVALID_DECK_CODE` | 400 | デッキコード形式不正 |
| `DECK_NAME_REQUIRED` | 400 | デッキ名が必須 |

### インポート/エクスポート関連エラー 🔵 *REQ-035, REQ-036より*

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `INVALID_FORMAT` | 400 | データフォーマット不正 |
| `IMPORT_SIZE_EXCEEDED` | 400 | インポートデータサイズ超過 |
| `EXPORT_FAILED` | 500 | エクスポート処理失敗 |

### 認証関連エラー（Phase 2） 🔵 *REQ-022より*

| エラーコード | HTTPステータス | 説明 |
|---|---|---|
| `INVALID_TOKEN` | 401 | トークンが無効 |
| `TOKEN_EXPIRED` | 401 | トークンの有効期限切れ |
| `INSUFFICIENT_PERMISSIONS` | 403 | 権限不足 |

---

## レート制限 🟡 *Azure Functions標準設定より*

### Phase 1

制限なし（単一ユーザーのため）

### Phase 2

| エンドポイント | 制限 | 期間 |
|---|---|---|
| 全エンドポイント | 100リクエスト | 1分間 |
| `/import` | 10リクエスト | 1時間 |
| `/export` | 20リクエスト | 1時間 |

**レート制限超過時のレスポンス**:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト制限を超過しました。しばらく待ってから再試行してください",
    "details": {
      "retryAfter": 60
    }
  },
  "meta": {
    "timestamp": "2025-10-24T12:34:56.789Z",
    "requestId": "req_abc123"
  }
}
```

**レスポンスヘッダー**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735047296
Retry-After: 60
```

---

## CORS設定 🟡 *Azure Static Web Apps標準設定より*

### Phase 1

```json
{
  "allowedOrigins": ["https://<your-app-name>.azurestaticapps.net"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["Content-Type", "Authorization"],
  "maxAge": 3600
}
```

### Phase 2

同上 + 追加で開発環境のOriginを許可

```json
{
  "allowedOrigins": [
    "https://<your-app-name>.azurestaticapps.net",
    "http://localhost:5173"
  ]
}
```

---

## パフォーマンス要件 🔵 *REQ-038より*

| エンドポイント | 目標レスポンスタイム | 最大許容時間 |
|---|---|---|
| `GET /battle-logs` | < 500ms | < 1000ms |
| `POST /battle-logs` | < 300ms | < 500ms |
| `DELETE /battle-logs/{id}` | < 300ms | < 500ms |
| `GET /statistics` | < 1000ms | < 3000ms |
| `POST /import` | < 2000ms | < 5000ms |
| `POST /export` | < 2000ms | < 5000ms |

---

## セキュリティ 🔵 *REQ-051, REQ-052より*

### Phase 1（単一ユーザー）

- **認証**: なし
- **データアクセス**: 全データに無制限アクセス
- **HTTPS**: 必須

### Phase 2（マルチユーザー）

- **認証**: Azure AD B2C Bearer Token必須
- **データアクセス**: ユーザーIDによる行レベルセキュリティ
- **HTTPS**: 必須
- **トークン有効期限**: 1時間
- **リフレッシュトークン**: 7日間

---

## モニタリング 🟡 *Azure Application Insights標準より*

全エンドポイントで以下のメトリクスを記録:

- **リクエスト数**
- **レスポンスタイム**
- **エラー率**
- **HTTPステータスコード分布**
- **リクエストサイズ**
- **レスポンスサイズ**

---

## バージョニング戦略 🟡 *RESTful APIベストプラクティスより*

### 現在のバージョン: v1（暗黙）

```
https://<your-app-name>.azurestaticapps.net/api/battle-logs
```

### 将来のバージョン管理（v2以降）

URLにバージョン番号を含める:

```
https://<your-app-name>.azurestaticapps.net/api/v2/battle-logs
```

**後方互換性の保証**:
- マイナーバージョンアップ: 後方互換性維持
- メジャーバージョンアップ: 破壊的変更を含む可能性（6ヶ月の移行期間）

---

## 実装ガイド

### Azure Functions実装例 🟡

**フォルダ構造**:

```
backend/
├── src/
│   ├── functions/
│   │   ├── battle-logs.ts       // GET/POST /battle-logs
│   │   ├── battle-log-detail.ts // GET/DELETE /battle-logs/{id}
│   │   ├── statistics.ts        // GET /statistics
│   │   ├── deck-master.ts       // GET /deck-master
│   │   ├── import.ts            // POST /import
│   │   ├── export.ts            // POST /export (Phase 2)
│   │   ├── my-decks.ts          // GET/POST /my-decks (Phase 2)
│   │   └── auth.ts              // GET /auth/verify (Phase 2)
│   ├── services/
│   │   ├── blobStorageService.ts
│   │   ├── validationService.ts
│   │   ├── statisticsService.ts
│   │   └── authService.ts (Phase 2)
│   └── types/
│       └── index.ts
└── host.json
```

**エンドポイント登録例** (`battle-logs.ts`):

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getBattleLogs, createBattleLog } from "../services/battleLogService";

// GET /api/battle-logs
app.http("getBattleLogs", {
  methods: ["GET"],
  route: "battle-logs",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const limit = parseInt(request.query.get("limit") || "100");
      const offset = parseInt(request.query.get("offset") || "0");
      const sortBy = request.query.get("sortBy") || "date";
      const sortOrder = request.query.get("sortOrder") || "desc";

      const result = await getBattleLogs({ limit, offset, sortBy, sortOrder });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      context.error("Error in getBattleLogs:", error);
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});

// POST /api/battle-logs
app.http("createBattleLog", {
  methods: ["POST"],
  route: "battle-logs",
  authLevel: "anonymous",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json();
      const battleLog = await createBattleLog(body);

      return {
        status: 201,
        jsonBody: {
          success: true,
          data: { battleLog },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    } catch (error) {
      if (error.name === "ValidationError") {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: error.message,
              details: error.details,
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: context.invocationId,
            },
          },
        };
      }

      context.error("Error in createBattleLog:", error);
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "サーバーエラーが発生しました",
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: context.invocationId,
          },
        },
      };
    }
  },
});
```

---

## テスト戦略 🔵 *REQ-050より*

### 単体テスト

各エンドポイントのロジックを個別にテスト:

```typescript
describe("POST /api/battle-logs", () => {
  it("正常な対戦履歴を登録できる", async () => {
    const response = await request(app)
      .post("/api/battle-logs")
      .send({
        date: "2025-01-24",
        battleType: "ランクマッチ",
        rank: "ダイアモンド",
        group: "AAA",
        myDeckId: "deck_001",
        turn: "先攻",
        result: "勝ち",
        opponentDeckId: "deck_master_002",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.battleLog.id).toBeDefined();
  });

  it("未来の日付は登録できない", async () => {
    const response = await request(app)
      .post("/api/battle-logs")
      .send({
        date: "2099-12-31",
        // ...
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("FUTURE_DATE_NOT_ALLOWED");
  });
});
```

### 統合テスト

エンドツーエンドのフローをテスト:

```typescript
describe("対戦履歴の登録→取得→削除フロー", () => {
  it("一連の操作が正常に完了する", async () => {
    // 1. 登録
    const createResponse = await request(app).post("/api/battle-logs").send({ /* ... */ });
    const battleLogId = createResponse.body.data.battleLog.id;

    // 2. 取得
    const getResponse = await request(app).get("/api/battle-logs");
    expect(getResponse.body.data.battleLogs).toContainEqual(
      expect.objectContaining({ id: battleLogId })
    );

    // 3. 削除
    const deleteResponse = await request(app).delete(`/api/battle-logs/${battleLogId}`);
    expect(deleteResponse.status).toBe(200);

    // 4. 削除確認
    const getAfterDelete = await request(app).get("/api/battle-logs");
    expect(getAfterDelete.body.data.battleLogs).not.toContainEqual(
      expect.objectContaining({ id: battleLogId })
    );
  });
});
```

### パフォーマンステスト

```typescript
describe("パフォーマンステスト", () => {
  it("GET /api/battle-logs は1000ms以内にレスポンスを返す", async () => {
    const start = Date.now();
    const response = await request(app).get("/api/battle-logs?limit=100");
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| 1.0.0 | 2025-10-24 | 初版作成 |

---

## 参考資料

- [Azure Functions HTTP trigger](https://learn.microsoft.com/azure/azure-functions/functions-bindings-http-webhook-trigger)
- [Azure Static Web Apps API](https://learn.microsoft.com/azure/static-web-apps/apis-overview)
- [RESTful API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/docs/Web/HTTP/Status)

---

**ドキュメント終了**
