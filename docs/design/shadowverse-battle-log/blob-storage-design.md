# Azure Blob Storage 設計 (Azure版 - 非推奨)

> ⚠️ **注意**: このドキュメントはAzure Blob Storage版の設計です。現在はCloudflare D1に移行済みのため、
> 最新の設計は `storage-design-cloudflare.md` を参照してください。

このドキュメントでは、シャドウバース対戦履歴管理アプリケーションにおけるAzure Blob Storageのデータ構造、アクセスパターン、運用方針を定義します。

**【信頼性レベル凡例】**:
- 🔵 **青信号**: EARS要件定義書・設計文書を参考にしてほぼ推測していない場合
- 🟡 **黄信号**: EARS要件定義書・設計文書から妥当な推測の場合
- 🔴 **赤信号**: EARS要件定義書・設計文書にない推測の場合

---

## 概要

**データストレージ**: Azure Blob Storage 🔵 *REQ-602より*
**データ形式**: JSON 🔵 *REQ-601, REQ-602より*
**互換性**: 既存データ (battle-logs.json, deck-master.json, my-decks.json) と互換性あり 🔵 *REQ-601より*

---

## コンテナ構成

### Phase 1 (認証なし)

**コンテナ名**: `shadowverse-data`
**アクセスレベル**: Private (匿名アクセス不可)
**データ構成**: ルートディレクトリにすべてのファイルを配置

```
shadowverse-data/  (Container)
├── battle-logs.json        # 対戦履歴データ
├── deck-master.json        # デッキマスター（共通データ）
└── my-decks.json           # マイデッキデータ (Phase 1では1ユーザー分のみ)
```

### Phase 2 (Azure AD B2C 認証あり)

**コンテナ名**: `shadowverse-data`
**アクセスレベル**: Private (匿名アクセス不可)
**データ構成**: ユーザーIDごとにディレクトリを分離

```
shadowverse-data/  (Container)
├── shared/
│   └── deck-master.json       # デッキマスター（全ユーザー共通）
├── {userId-1}/                # ユーザー1のデータ
│   ├── battle-logs.json       # 対戦履歴データ
│   ├── my-decks.json          # マイデッキデータ
│   └── user-settings.json     # ユーザー設定 (将来拡張)
├── {userId-2}/                # ユーザー2のデータ
│   ├── battle-logs.json
│   ├── my-decks.json
│   └── user-settings.json
└── ...
```

---

## JSONファイル構造

### battle-logs.json (対戦履歴)

**説明**: 対戦履歴を配列形式で格納
**更新頻度**: 高頻度 (対戦ごとに1件追加)
**想定サイズ**: 1,000件で約300KB 🔵 *NFR-003より*

```json
[
  {
    "id": "1",
    "date": "2025/10/23",
    "battleType": "ランクマッチ",
    "rank": "ダイアモンド",
    "group": "A",
    "myDeckId": "1",
    "turn": "先行",
    "result": "WIN",
    "opponentDeckId": "2"
  },
  {
    "id": "2",
    "date": "2025/10/23",
    "battleType": "ランクマッチ",
    "rank": "ダイアモンド",
    "group": "A",
    "myDeckId": "1",
    "turn": "後攻",
    "result": "LOSE",
    "opponentDeckId": "3"
  }
]
```

**スキーマ**:
- `id` (string, required): 対戦履歴ID (自動採番、文字列型)
- `date` (string, required): 対戦日付 (YYYY/MM/DD形式)
- `battleType` (string, required): 対戦タイプ ("ランクマッチ" | "対戦台" | "ロビー大会")
- `rank` (string, required): ランク ("サファイア" | "ダイアモンド" | "ルビー" | "トパーズ" | "-")
- `group` (string, required): グループ ("A" | "AA" | "AAA" | "Master" | "-")
- `myDeckId` (string, required): マイデッキID (my-decks.json への参照)
- `turn` (string, required): ターン ("先行" | "後攻")
- `result` (string, required): 対戦結果 ("WIN" | "LOSE")
- `opponentDeckId` (string, required): 相手デッキID (deck-master.json への参照)

**インデックス設計**:
- JSONファイル全体を読み込んでフィルタリング・ソート (MVP段階)
- 将来的にはデータベース移行時にインデックス追加

---

### deck-master.json (デッキマスター)

**説明**: 対戦相手のデッキタイプのマスターデータ
**更新頻度**: 低頻度 (Phase 2以降、ユーザーが追加・編集可能)
**想定サイズ**: 100件で約10KB

```json
[
  {
    "id": "1",
    "className": "ウィッチ",
    "deckName": "土スペルウィッチ",
    "sortOrder": 1
  },
  {
    "id": "2",
    "className": "ロイヤル",
    "deckName": "ミッドレンジロイヤル",
    "sortOrder": 2
  }
]
```

**スキーマ**:
- `id` (string, required): デッキID (自動採番、文字列型)
- `className` (string, required): クラス名 (例: "ウィッチ", "ロイヤル")
- `deckName` (string, required): デッキ名 (例: "土スペルウィッチ")
- `sortOrder` (number, required): ソート順

**Phase 1**: すべてのファイルのルートに配置 (`shadowverse-data/deck-master.json`)
**Phase 2**: `shared/deck-master.json` に移動（全ユーザー共通）

---

### my-decks.json (マイデッキ)

**説明**: ユーザーが使用するデッキの登録情報
**更新頻度**: 低頻度 (Phase 2以降、ユーザーが追加・編集)
**想定サイズ**: 10件で約2KB

```json
[
  {
    "id": "1",
    "deckId": "1",
    "deckCode": "3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1",
    "deckName": "秘術オデンスペル",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**スキーマ**:
- `id` (string, required): デッキID (自動採番、文字列型)
- `deckId` (string, required): デッキマスターID (deck-master.json への参照)
- `deckCode` (string, required): デッキコード (シャドウバースの公式コード)
- `deckName` (string, required): デッキ名 (ユーザー設定)
- `isActive` (boolean, required): アクティブフラグ (現在使用中)
- `createdAt` (string, required): 作成日時 (ISO 8601形式)

---

## アクセスパターン

### Phase 1: 対戦履歴の読み書き

#### 読み取り (GET battle-logs.json)

```typescript
// Azure Functions (Node.js/TypeScript) での実装例
import { BlobServiceClient } from "@azure/storage-blob";

async function getBattleLogs(): Promise<BattleLog[]> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const containerClient = blobServiceClient.getContainerClient("shadowverse-data");
  const blobClient = containerClient.getBlobClient("battle-logs.json");

  const downloadResponse = await blobClient.download();
  const content = await streamToString(downloadResponse.readableStreamBody!);

  return JSON.parse(content) as BattleLog[];
}
```

#### 書き込み (PUT battle-logs.json)

```typescript
async function saveBattleLogs(battleLogs: BattleLog[]): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const containerClient = blobServiceClient.getContainerClient("shadowverse-data");
  const blockBlobClient = containerClient.getBlockBlobClient("battle-logs.json");

  const content = JSON.stringify(battleLogs, null, 2);
  await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}
```

### Phase 2: ユーザーごとのデータアクセス

```typescript
async function getBattleLogsByUserId(userId: string): Promise<BattleLog[]> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const containerClient = blobServiceClient.getContainerClient("shadowverse-data");
  const blobClient = containerClient.getBlobClient(`${userId}/battle-logs.json`);

  const downloadResponse = await blobClient.download();
  const content = await streamToString(downloadResponse.readableStreamBody!);

  return JSON.parse(content) as BattleLog[];
}
```

---

## 同時実行制御

### Phase 1 (MVP段階)

**方針**: 同時実行制御なし（楽観的ロック不使用）🟡 *NFR-002（同時利用者10人以下）より*

**理由**:
- 想定ユーザー数が少ない（同時利用者10人以下）
- 対戦履歴登録の競合は低頻度
- MVP段階のため、シンプルな実装を優先

**リスク**:
- 同時更新時にデータが上書きされる可能性（Last Write Wins）
- 統計計算中に新規データが追加された場合、統計に反映されない可能性

### Phase 2 以降（将来的な改善）

**方針**: ETags を使用した楽観的ロック 🟡 *将来の拡張性を考慮*

```typescript
async function saveBattleLogsWithETag(battleLogs: BattleLog[]): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const containerClient = blobServiceClient.getContainerClient("shadowverse-data");
  const blockBlobClient = containerClient.getBlockBlobClient("battle-logs.json");

  // ETagを取得
  const properties = await blockBlobClient.getProperties();
  const etag = properties.etag;

  const content = JSON.stringify(battleLogs, null, 2);

  // ETagを条件に更新 (競合時は412 Precondition Failedが返る)
  await blockBlobClient.upload(content, content.length, {
    conditions: { ifMatch: etag },
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}
```

---

## バックアップ戦略

### Azure Blob Storage の自動バックアップ

**方針**: Azure Blob Storage の組み込み機能を使用 🟡 *可用性要件から妥当な推測*

**機能**:
- **論理的な削除 (Soft Delete)**: 削除後7日間はデータを復元可能
- **ポイントインタイムリストア**: 過去の特定時点にデータを復元
- **バージョン管理**: Blobの過去バージョンを保持

**設定例**:
- Soft Delete: 有効化 (保持期間: 7日)
- Blob Versioning: 有効化 (Phase 2以降)

### 手動バックアップ (オプション)

**頻度**: 週次
**方法**: Azure Functions の Timer Trigger でJSONファイルを別コンテナにコピー

```typescript
// Timer Trigger: 毎週日曜日 0:00 に実行
export async function weeklyBackup(timer: Timer): Promise<void> {
  const sourceContainer = "shadowverse-data";
  const backupContainer = `backup-${new Date().toISOString().split('T')[0]}`;

  // コンテナ作成 & ファイルコピー
  // ...
}
```

---

## データマイグレーション計画

### Phase 1 → Phase 2 (認証導入時)

**移行内容**: ルートのファイル → `{userId}/` ディレクトリに移動

**手順**:
1. Phase 1で登録されたデータを管理者権限で取得
2. 初回ログインユーザーに対してデータを割り当て
3. `{userId}/battle-logs.json` に移動
4. `shared/deck-master.json` に移動

**Azur Functions マイグレーションスクリプト**:

```typescript
async function migratePhase1ToPhase2(userId: string): Promise<void> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  const containerClient = blobServiceClient.getContainerClient("shadowverse-data");

  // Phase 1のデータを取得
  const battleLogsBlob = containerClient.getBlobClient("battle-logs.json");
  const battleLogsContent = await streamToString((await battleLogsBlob.download()).readableStreamBody!);
  const battleLogs = JSON.parse(battleLogsContent);

  // Phase 2のディレクトリに保存
  const userBattleLogsBlob = containerClient.getBlockBlobClient(`${userId}/battle-logs.json`);
  await userBattleLogsBlob.upload(JSON.stringify(battleLogs, null, 2), JSON.stringify(battleLogs).length);

  // Phase 1のファイルを削除 (オプション)
  // await battleLogsBlob.delete();
}
```

### Phase 2 → データベース移行 (将来的)

**移行先**: Azure SQL Database / PostgreSQL (Supabase)

**手順**:
1. データベーススキーマ作成 (SQL DDL)
2. JSONファイルを読み込み、データベースにINSERT
3. 既存APIを徐々にデータベース接続に変更
4. Blob Storage は履歴データのアーカイブとして保持

---

## パフォーマンス最適化

### ファイルサイズの制限

**最大ファイルサイズ**: 10MB 🟡 *一般的な制限から妥当な推測*
**想定データ量**: 1,000件で約300KB → 余裕あり

**対策**:
- 10,000件を超える場合、年次でファイルを分割 (例: `battle-logs-2025.json`)
- データベース移行を検討

### キャッシュ戦略

**方針**: Azure Functions の Application Insights でキャッシュ 🟡 *パフォーマンス要件から妥当な推測*

**キャッシュ対象**:
- `deck-master.json`: 更新頻度が低いため、5分間キャッシュ
- `battle-logs.json`: リアルタイム性が重要なため、キャッシュしない

**実装例**:

```typescript
let deckMasterCache: { data: DeckMaster[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5分

async function getDeckMastersWithCache(): Promise<DeckMaster[]> {
  const now = Date.now();

  if (deckMasterCache && now - deckMasterCache.timestamp < CACHE_TTL) {
    return deckMasterCache.data; // キャッシュから返却
  }

  const data = await getDeckMasters(); // Blob Storageから取得
  deckMasterCache = { data, timestamp: now };

  return data;
}
```

---

## セキュリティ

### アクセス制御

**Phase 1**: Azure Functions の Managed Identity でアクセス 🟡 *セキュリティ要件から妥当な推測*
**Phase 2**: SAS (Shared Access Signature) トークンまたは Managed Identity

**設定**:
- コンテナのアクセスレベル: Private
- Azure Functions に対して Blob Storage への読み書き権限を付与

### 環境変数管理

**接続文字列**: Azure Functions の Application Settings に保存 🔵 *NFR-102より*

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
```

---

## 運用監視

### ログ記録

**ツール**: Application Insights 🟡 *可観測性要件から妥当な推測*

**記録内容**:
- Blob Storage アクセスログ (Read/Write)
- エラーログ (接続失敗、パース失敗等)
- パフォーマンスログ (レスポンスタイム)

### アラート設定

**条件**:
- Blob Storage 接続エラーが3回以上発生
- ファイルサイズが5MB を超える
- レスポンスタイムが3秒を超える

**通知先**: メール / Slack (Phase 2)

---

## 更新履歴

- **2025-10-23**: 初版作成（tsumiki:kairo-design により自動生成）
  - Phase 1（認証なし）・Phase 2（認証あり）のデータ構造定義
  - アクセスパターン、同時実行制御、バックアップ戦略を定義
  - データマイグレーション計画を追加
