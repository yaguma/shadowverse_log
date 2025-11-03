# TDD要件定義書: Statistics API実装 - 分布データ

**機能名**: Statistics API - 対戦相手デッキ分布（円グラフ用データ）
**タスクID**: TASK-0011
**実装者**: AI Assistant (Claude)
**作成日**: 2025-11-03
**更新日**: 2025-11-03

---

## 1. 機能の概要

### 🔵 何をする機能か

TASK-0010で実装した Statistics API に対戦相手デッキの分布データ（円グラフ用）を追加する。`StatisticsResponse` に `opponentDeckDistribution` フィールドを追加し、各相手デッキの対戦回数と割合を計算して返す機能を実装する。

### 🔵 どのような問題を解決するか

**As a**: シャドウバースプレイヤー
**I want to**: 対戦相手のデッキ構成を円グラフで視覚的に確認したい
**So that**:

- 環境に多いデッキを把握できる
- 自分のデッキ選択の参考にできる
- メタゲームの傾向を理解できる
- 対策すべきデッキを特定できる
- 期間ごとの環境変化を追跡できる

### 🔵 想定されるユーザー

- **直接ユーザー**: フロントエンド（React）の統計ダッシュボード画面の円グラフコンポーネント
- **間接ユーザー**: 環境分析をして勝率を向上させたいシャドウバースプレイヤー

### 🔵 システム内での位置づけ

```
[Frontend (React) - StatsDashboard]
  ↓ GET /api/statistics?startDate=...&endDate=...
[Azure Functions - getStatistics] (TASK-0010で実装済み)
  ↓
[StatisticsService] ← 【今回拡張】
  ↓ データ取得 (getBattleLogs, getDeckMasters, getMyDecks)
  ↓ フィルタリング (期間, 対戦タイプ)
  ↓ 統計計算 (全体, デッキ別, ランク別, ターン別)
  ↓ 分布計算 (opponentDeckDistribution) ← 【今回追加】
  ↓
[BlobStorageClient] (TASK-0006で実装済み)
  ↓
[Azure Blob Storage]
  ├── battle-logs.json
  ├── deck-master.json
  └── my-decks.json
```

**アーキテクチャ上の役割**:
- **層**: ドメイン層 (Domain Layer)
- **パターン**: ビジネスロジックの拡張
- **責務**:
  - 対戦相手デッキIDでグループ化
  - 出現回数のカウント
  - パーセンテージの計算（小数点第1位まで）
  - 出現回数降順でソート

### 🔵 参照したEARS要件

- **REQ-204**: 対戦相手デッキ分布を円グラフで表示 🔵
- **REQ-203**: 統計情報を表示（相手デッキ別勝率を含む） 🔵
- **NFR-001**: レスポンス時間3秒以内 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (TASK-0011, Lines 1688-1895)
- **型定義**: `backend/src/types/index.ts` (Lines 170-175: opponentDeckDistribution interface)
- **依存タスク**: TASK-0010 (Statistics API基本統計 - 完了済み)

---

## 2. 入力・出力の仕様

### 🔵 APIエンドポイント仕様

**HTTPメソッド**: GET
**パス**: `/api/statistics`
**入力パラメータ**: TASK-0010と同じ（変更なし）
  - `startDate` (optional): YYYY-MM-DD形式
  - `endDate` (optional): YYYY-MM-DD形式
  - `battleType` (optional): "ランクマッチ" | "対戦台" | "ロビー大会"

### 🔵 追加されるレスポンスフィールド

#### opponentDeckDistribution配列

```typescript
export interface OpponentDeckDistribution {
  deckId: string;        // 相手デッキID (例: "deck_master_002")
  deckName: string;      // デッキ名 (例: "進化ネクロ")
  count: number;         // 対戦回数 (例: 25)
  percentage: number;    // 割合（小数点第1位まで） (例: 25.5%)
}

// StatisticsResponse に追加
export interface StatisticsResponse {
  // ... 既存のフィールド (overall, byMyDeck, byOpponentDeck, byRank, byTurn, dateRange)
  opponentDeckDistribution: OpponentDeckDistribution[];  // ← 追加
}
```

### 🔵 レスポンス例

#### 成功レスポンス (200 OK)

```json
{
  "success": true,
  "data": {
    "overall": { ... },
    "byMyDeck": [ ... ],
    "byOpponentDeck": [ ... ],
    "byRank": [ ... ],
    "byTurn": { ... },
    "opponentDeckDistribution": [
      {
        "deckId": "deck_master_002",
        "deckName": "進化ネクロ",
        "count": 45,
        "percentage": 30.0
      },
      {
        "deckId": "deck_master_005",
        "deckName": "ミッドレンジロイヤル",
        "count": 38,
        "percentage": 25.3
      },
      {
        "deckId": "deck_master_010",
        "deckName": "秘術ウィッチ",
        "count": 30,
        "percentage": 20.0
      },
      {
        "deckId": "deck_master_015",
        "deckName": "連携ロイヤル",
        "count": 22,
        "percentage": 14.7
      },
      {
        "deckId": "deck_master_020",
        "deckName": "自然エルフ",
        "count": 15,
        "percentage": 10.0
      }
    ],
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    }
  },
  "meta": { ... }
}
```

**データの特性**:
- 配列は `count` の降順でソート（出現回数が多い順）
- `percentage` の合計は100%になる（端数処理により±0.1%の誤差あり）
- 小数点第1位まで表示（例: 25.3%）

#### データが0件の場合 (200 OK)

```json
{
  "success": true,
  "data": {
    "overall": { "totalGames": 0, ... },
    "byMyDeck": [],
    "byOpponentDeck": [],
    "byRank": [],
    "byTurn": { ... },
    "opponentDeckDistribution": [],  // 空配列
    "dateRange": { ... }
  },
  "meta": { ... }
}
```

### 🔵 計算ロジック

#### 1. opponentDeckDistribution計算メソッド

```typescript
/**
 * 対戦相手デッキ分布を計算（円グラフ用データ）
 *
 * @param logs - フィルタリング済み対戦履歴
 * @param deckMasters - デッキマスターデータ
 * @returns 相手デッキ分布配列（出現回数降順）
 */
private calculateOpponentDeckDistribution(
  logs: BattleLog[],
  deckMasters: DeckMaster[]
): OpponentDeckDistribution[] {
  const totalGames = logs.length;
  const deckCountMap = new Map<string, number>();

  // 1. opponentDeckIdでカウント
  logs.forEach((log) => {
    const count = deckCountMap.get(log.opponentDeckId) || 0;
    deckCountMap.set(log.opponentDeckId, count + 1);
  });

  // 2. デッキ名を取得し、パーセンテージを計算
  const distribution: OpponentDeckDistribution[] = [];

  deckCountMap.forEach((count, deckId) => {
    const deckName = deckMasters.find((d) => d.id === deckId)?.deckName || '不明なデッキ';
    const percentage = totalGames > 0 ? Math.round((count / totalGames) * 1000) / 10 : 0;

    distribution.push({
      deckId,
      deckName,
      count,
      percentage,
    });
  });

  // 3. count降順でソート
  return distribution.sort((a, b) => b.count - a.count);
}
```

#### 2. パーセンテージ計算式

```typescript
percentage = Math.round((count / totalGames) * 1000) / 10
```

**計算例**:
- `count = 45`, `totalGames = 150`
- `percentage = Math.round((45 / 150) * 1000) / 10 = Math.round(300) / 10 = 30.0`

**丸め処理の理由**:
- 小数点第1位まで表示（UI要件）
- 勝率計算と同じ丸め方式を採用（一貫性）

#### 3. calculateStatisticsメソッドへの統合

```typescript
async calculateStatistics(params: StatisticsParams): Promise<StatisticsResponse> {
  // ... 既存のコード（TASK-0010で実装済み）

  // 統計計算
  const overall = this.calculateOverall(filteredLogs);
  const byMyDeck = this.calculateByMyDeck(filteredLogs, myDecks);
  const byOpponentDeck = this.calculateByOpponentDeck(filteredLogs, deckMasters);
  const byRank = this.calculateByRank(filteredLogs);
  const byTurn = this.calculateByTurn(filteredLogs);
  const opponentDeckDistribution = this.calculateOpponentDeckDistribution(filteredLogs, deckMasters); // ← 追加

  return {
    overall,
    byMyDeck,
    byOpponentDeck,
    byRank,
    byTurn,
    opponentDeckDistribution, // ← 追加
    dateRange: { startDate, endDate },
  };
}
```

### 🔵 参照したEARS要件

- **REQ-204**: 対戦相手デッキ分布を円グラフで表示 🔵
- **REQ-203**: 統計情報を表示（相手デッキ別勝率を含む） 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (Lines 1700-1772)
- **型定義**: `backend/src/types/index.ts` (Lines 170-175: OpponentDeckDistribution interface)
- **既存実装**: `backend/src/services/statisticsService.ts` (TASK-0010で実装済み)

---

## 3. 制約条件

### 🔵 パフォーマンス要件

- **NFR-001**: レスポンス時間3秒以内
  - TASK-0010の統計計算と合わせて3秒以内に完了する必要がある
  - 追加処理:
    - opponentDeckIdでのグループ化: O(n) = 1,000件程度
    - パーセンテージ計算: O(m) = デッキ種類数（10-20種類程度）
    - ソート: O(m log m) = デッキ種類数（10-20種類程度）
    - **合計追加時間**: < 100ms（許容範囲内）

- **パフォーマンス監視**:
  ```typescript
  async calculateStatistics(params: StatisticsParams): Promise<StatisticsResponse> {
    const startTime = Date.now();

    // ... 統計計算処理

    const endTime = Date.now();
    const duration = endTime - startTime;

    // パフォーマンスログ
    if (duration > 3000) {
      console.warn(`Statistics calculation took ${duration}ms (> 3000ms)`);
    }

    return result;
  }
  ```

### 🔵 データ整合性要件

- **パーセンテージの合計**: 100%に近い値になる（丸め誤差により±0.1%程度の誤差あり）
- **存在しないデッキIDの処理**: deckMastersに存在しない場合、deckNameを "不明なデッキ" とする
- **データ0件の場合**: 空配列 `[]` を返す

### 🔵 TypeScript制約

- **型安全性**: `OpponentDeckDistribution` インターフェースに準拠
- **null/undefined チェック**: deckMasters.find() の結果が undefined の場合のフォールバック処理
- **strict mode**: TypeScript strict mode準拠

### 🔵 参照したEARS要件

- **NFR-001**: レスポンス時間3秒以内 🔵
- **NFR-301**: TypeScript strict mode 🔵
- **EDGE-201**: 存在しないデッキIDが指定された場合に「不明なデッキ」として表示 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (Lines 1774-1794: パフォーマンス最適化)

---

## 4. 想定される使用例

### 🔵 基本的な使用パターン（正常系）

#### 例1: 直近7日間の相手デッキ分布を取得

**リクエスト**:
```http
GET /api/statistics
```

**説明**: デフォルト期間（直近7日間）の相手デッキ分布を取得

**レスポンス**: 200 OK
```json
{
  "success": true,
  "data": {
    "opponentDeckDistribution": [
      {
        "deckId": "deck_master_002",
        "deckName": "進化ネクロ",
        "count": 15,
        "percentage": 30.0
      },
      {
        "deckId": "deck_master_005",
        "deckName": "ミッドレンジロイヤル",
        "count": 12,
        "percentage": 24.0
      },
      {
        "deckId": "deck_master_010",
        "deckName": "秘術ウィッチ",
        "count": 10,
        "percentage": 20.0
      },
      {
        "deckId": "deck_master_015",
        "deckName": "連携ロイヤル",
        "count": 8,
        "percentage": 16.0
      },
      {
        "deckId": "deck_master_020",
        "deckName": "自然エルフ",
        "count": 5,
        "percentage": 10.0
      }
    ],
    "dateRange": {
      "startDate": "2025-10-27",
      "endDate": "2025-11-03"
    }
  }
}
```

#### 例2: 特定期間の環境分析

**リクエスト**:
```http
GET /api/statistics?startDate=2025-01-01&endDate=2025-01-31
```

**説明**: 2025年1月の相手デッキ分布を取得し、環境を分析

**レスポンス**: 200 OK
```json
{
  "success": true,
  "data": {
    "opponentDeckDistribution": [
      {
        "deckId": "deck_master_002",
        "deckName": "進化ネクロ",
        "count": 45,
        "percentage": 30.0
      },
      {
        "deckId": "deck_master_005",
        "deckName": "ミッドレンジロイヤル",
        "count": 38,
        "percentage": 25.3
      },
      {
        "deckId": "deck_master_010",
        "deckName": "秘術ウィッチ",
        "count": 30,
        "percentage": 20.0
      },
      {
        "deckId": "deck_master_015",
        "deckName": "連携ロイヤル",
        "count": 22,
        "percentage": 14.7
      },
      {
        "deckId": "deck_master_020",
        "deckName": "自然エルフ",
        "count": 15,
        "percentage": 10.0
      }
    ],
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    }
  }
}
```

**分析ポイント**:
- 進化ネクロが最も多い（30.0%）
- ミッドレンジロイヤルが2番目（25.3%）
- 上位2デッキで55.3%を占める → メタデッキとして対策が必要

#### 例3: ランクマッチのみの環境分析

**リクエスト**:
```http
GET /api/statistics?battleType=ランクマッチ&startDate=2025-01-01&endDate=2025-01-31
```

**説明**: ランクマッチのみの相手デッキ分布を取得（対戦台やロビー大会を除外）

**レスポンス**: 200 OK（ランクマッチのみの分布データ）

### 🔵 エッジケース

#### エッジケース1: データ0件の場合

**前提**: 期間内に対戦履歴が0件

**リクエスト**:
```http
GET /api/statistics?startDate=2025-12-01&endDate=2025-12-31
```

**レスポンス**: 200 OK
```json
{
  "success": true,
  "data": {
    "overall": { "totalGames": 0, ... },
    "opponentDeckDistribution": [],  // 空配列
    "dateRange": {
      "startDate": "2025-12-01",
      "endDate": "2025-12-31"
    }
  }
}
```

**期待される動作**: エラーではなく、空配列を返す

#### エッジケース2: パーセンテージの合計が100%になるか確認

**前提**: totalGames=3, 各デッキ1回ずつ対戦

**入力データ**:
```typescript
[
  { opponentDeckId: "deck_master_002" },  // 1回 → 33.3%
  { opponentDeckId: "deck_master_003" },  // 1回 → 33.3%
  { opponentDeckId: "deck_master_004" },  // 1回 → 33.3%
]
```

**期待される結果**:
```json
{
  "opponentDeckDistribution": [
    { "deckId": "deck_master_002", "count": 1, "percentage": 33.3 },
    { "deckId": "deck_master_003", "count": 1, "percentage": 33.3 },
    { "deckId": "deck_master_004", "count": 1, "percentage": 33.3 }
  ]
}
```

**パーセンテージの合計**: 33.3 + 33.3 + 33.3 = 99.9%
- 丸め誤差により100%にならない場合がある（許容範囲内）

#### エッジケース3: 存在しないデッキIDが含まれる場合

**前提**: battle-logs.jsonに `opponentDeckId: "deleted_deck_999"` が含まれるが、deck-master.jsonには存在しない

**期待される動作**: deckNameを "不明なデッキ" として分布に含める

**レスポンス例**:
```json
{
  "opponentDeckDistribution": [
    {
      "deckId": "deleted_deck_999",
      "deckName": "不明なデッキ",
      "count": 5,
      "percentage": 10.0
    },
    ...
  ]
}
```

#### エッジケース4: 1種類のデッキとしか対戦していない場合

**前提**: 全対戦が同じ相手デッキ（例: deck_master_002）

**期待される結果**:
```json
{
  "opponentDeckDistribution": [
    {
      "deckId": "deck_master_002",
      "deckName": "進化ネクロ",
      "count": 50,
      "percentage": 100.0
    }
  ]
}
```

**パーセンテージの合計**: 100.0%

### 🔵 エラーケース

TASK-0010で実装済みのエラーハンドリングがそのまま適用される:
- Blob Storage接続エラー → 500 Internal Server Error
- データ取得失敗 → 500 Internal Server Error

### 🔵 参照したEARS要件

- **REQ-204**: 対戦相手デッキ分布を円グラフで表示 🔵
- **REQ-405**: 集計期間にデータが存在しない場合、「データなし」のメッセージを表示 🔵
- **EDGE-201**: 存在しないデッキIDが指定された場合に「不明なデッキ」として表示 🔵

### 🔵 参照した設計文書

- **タスクファイル**: `docs/tasks/shadowverse-battle-log-phase2.md` (Lines 1797-1872: テスト要件)

---

## 5. EARS要件・設計文書との対応関係

### 参照したユーザストーリー

- **ストーリー**: シャドウバースプレイヤーとして、対戦相手のデッキ構成を円グラフで視覚的に確認したい

### 参照した機能要件

- **REQ-204**: 対戦相手デッキ分布を円グラフで表示 🔵
- **REQ-203**: 統計情報を表示（相手デッキ別勝率を含む） 🔵
- **REQ-205**: 統計情報をリアルタイムに計算・表示 🔵
- **REQ-405**: 集計期間にデータが存在しない場合、「データなし」のメッセージを表示 🔵

### 参照した非機能要件

- **NFR-001**: レスポンス時間3秒以内 🔵
- **NFR-301**: TypeScript strict mode 🔵
- **NFR-302**: TDD適用 🔵

### 参照したEdgeケース

- **EDGE-201**: 存在しないデッキIDが指定された場合に「不明なデッキ」として表示 🔵
- **EDGE-101**: 対戦履歴が0件の場合でも統計画面を表示 🔵

### 参照した受け入れ基準

- **AC-REQ-204**: 対戦相手デッキ分布が円グラフで表示される
- **AC-REQ-204-1**: パーセンテージの合計が100%に近い値になる（丸め誤差±0.1%程度）
- **AC-REQ-204-2**: 出現回数が多い順にソートされる
- **AC-REQ-204-3**: 各デッキの出現回数とパーセンテージが正確に表示される

### 参照した設計文書

#### タスクファイル
- `docs/tasks/shadowverse-battle-log-phase2.md`
  - Lines 1688-1895: TASK-0011 実装詳細
  - Lines 1700-1746: opponentDeckDistribution計算ロジック
  - Lines 1748-1772: calculateStatisticsメソッドの更新
  - Lines 1774-1794: パフォーマンス最適化
  - Lines 1797-1872: テスト要件

#### 型定義
- `backend/src/types/index.ts`
  - Lines 170-175: OpponentDeckDistribution interface

#### 既存実装
- `backend/src/services/statisticsService.ts`
  - TASK-0010で実装済みのStatisticsServiceクラス
  - calculateStatistics()メソッド
  - 既存の統計計算ロジック

---

## 6. 実装の優先順位

### Phase 1 (TASK-0011) - 必須機能

1. ✅ **OpponentDeckDistribution型定義** (`backend/src/types/index.ts`)
   - インターフェース定義は既に存在（Lines 170-175）

2. ✅ **calculateOpponentDeckDistribution()メソッド実装** (`backend/src/services/statisticsService.ts`)
   - opponentDeckIdでグループ化
   - カウント集計
   - パーセンテージ計算（小数点第1位まで）
   - count降順でソート

3. ✅ **calculateStatistics()メソッドの更新** (`backend/src/services/statisticsService.ts`)
   - calculateOpponentDeckDistribution()呼び出しを追加
   - レスポンスにopponentDeckDistributionを含める

4. ✅ **単体テスト実装** (`backend/tests/services/statisticsService.test.ts`)
   - 正常系テスト (2ケース以上)
     - 対戦相手デッキ分布が正しく計算される
     - パーセンテージの合計が100%になる
   - 境界値テスト (1ケース)
     - データ0件の場合
   - 合計: 3ケース以上

5. ✅ **パフォーマンステスト実装** (`backend/tests/services/statisticsService.test.ts`)
   - 1000件のデータを3秒以内に処理できる

### Phase 2 - 将来の拡張（今回対象外）

1. ⏳ **円グラフコンポーネント** - フロントエンドでの可視化
2. ⏳ **期間比較機能** - 前期間との比較表示
3. ⏳ **クラス別集計** - デッキではなくクラス単位での集計

---

## 7. 品質判定

### ✅ 高品質: 実装可能

- **要件の曖昧さ**: なし（タスクファイル、型定義で明確化済み）
- **入出力定義**: 完全（OpponentDeckDistributionインターフェース明確）
- **制約条件**: 明確（パフォーマンス、データ整合性、TypeScript制約）
- **実装可能性**: 確実（TASK-0010の既存実装に追加するだけ）
- **テスタビリティ**: 高（既存テストパターンを活用可能）

### 信頼性レベルサマリー

- 🔵 **青信号** (ほぼ推測なし): 100%
  - 機能要件 (REQ-204, REQ-203)
  - 非機能要件 (NFR-001, NFR-301, NFR-302)
  - Edgeケース (EDGE-201, EDGE-101)
  - タスクファイルとの整合性
  - 型定義との整合性
  - 既存実装との整合性

- 🟡 **黄信号** (妥当な推測): 0%

- 🔴 **赤信号** (推測): 0%

### 重要な注意事項

#### TASK-0010との統合 ⚠️

- **既存機能への影響**: なし（追加のみ、既存ロジックは変更しない）
- **既存テストへの影響**: なし（既存テストは引き続き成功する必要がある）
- **パフォーマンスへの影響**: 最小限（追加処理時間 < 100ms）

#### パーセンテージの丸め処理 ⚠️

- **計算式**: `Math.round((count / totalGames) * 1000) / 10`
- **丸め誤差**: パーセンテージの合計が100%にならない場合がある（±0.1%程度）
- **許容範囲**: 99.9% ~ 100.1% の範囲内であれば正常

#### 依存タスク ⚠️

- **TASK-0010**: Statistics API基本統計が実装済みであること
  - `StatisticsService` クラスが存在
  - `calculateStatistics()` メソッドが動作
  - 既存の統計計算ロジックが正常動作

---

## 8. 次のステップ

✅ **要件定義完了**

次のお勧めステップ: `/tsumiki:tdd-testcases` でテストケースの洗い出しを行います。

**完了条件**:

- [ ] OpponentDeckDistribution型定義が存在する
- [ ] calculateOpponentDeckDistribution()メソッドが実装されている
- [ ] calculateStatistics()メソッドがopponentDeckDistributionを返す
- [ ] 対戦相手デッキ分布が正しく計算される
- [ ] パーセンテージの合計が100%になる（丸め誤差±0.1%程度）
- [ ] 出現回数降順でソートされる
- [ ] データ0件の場合でも空配列を返す
- [ ] 存在しないデッキIDの場合、"不明なデッキ"として処理される
- [ ] パフォーマンス最適化（1000件で3秒以内）が達成されている
- [ ] 単体テストが100%成功する (3ケース以上)
- [ ] Biome lintエラーが0件
- [ ] TypeScript型エラーが0件

---

**作成日**: 2025-11-03
**更新日**: 2025-11-03
**ステータス**: ✅ 完了
