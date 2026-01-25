# Cloudflare Migration (Azure → Cloudflare) - タスク概要

## プロジェクト概要

- **プロジェクト名**: Cloudflare Migration (Azure → Cloudflare)
- **開発期間**: 18営業日 (約3.6週間)
- **総工数**: 144時間
- **総タスク数**: 22タスク (TASK-0021 ~ TASK-0042)
- **開発フェーズ**: Phase 1 (基盤構築) + Phase 2 (バックエンド) + Phase 3 (フロントエンド) + Phase 4 (認証・最適化)
- **開発アプローチ**: TDD (ビジネスロジック) + DIRECT (環境構築・設定)

## フェーズ構成

| フェーズ | 期間 | 主な成果物 | 工数 | ファイル |
|---|---|---|---|---|
| Phase 1-1a-i | Day 1 | Cloudflareアカウント・Node.js | 4h | [part1a-i](./cloudflare-migration-phase1-part1a-i.md) |
| Phase 1-1a-ii | Day 1 | Wrangler・backend環境 | 4h | [part1a-ii](./cloudflare-migration-phase1-part1a-ii.md) |
| Phase 1-1b | Day 1 | D1データベース・スキーマ | 4h | [part1b](./cloudflare-migration-phase1-part1b.md) |
| Phase 1-2-i | Day 2 | Drizzle ORM統合 | 4h | [part2-i](./cloudflare-migration-phase1-part2-i.md) |
| Phase 1-2-ii | Day 2 | ~~R2バケット~~ エクスポート/インポート | 4h | [part2-ii](./cloudflare-migration-phase1-part2-ii.md) |
| Phase 1-3a-i | Day 3 | リポジトリ基盤・Battles | 4h | [part3a-i](./cloudflare-migration-phase1-part3a-i.md) |
| Phase 1-3a-ii | Day 3 | DecksMaster・Statistics | 4h | [part3a-ii](./cloudflare-migration-phase1-part3a-ii.md) |
| Phase 1-3b-i | Day 4 | JSONデータ分析・マイグレ | 4h | [part3b-i](./cloudflare-migration-phase1-part3b-i.md) |
| Phase 1-3b-ii | Day 4 | データ検証・バックアップ | 4h | [part3b-ii](./cloudflare-migration-phase1-part3b-ii.md) |
| Phase 1-4-i | Day 5 | 環境変数・型定義 | 4h | [part4-i](./cloudflare-migration-phase1-part4-i.md) |
| Phase 1-4-ii | Day 5 | ローカル開発サーバー | 4h | [part4-ii](./cloudflare-migration-phase1-part4-ii.md) |
| Phase 2-1-i | Day 6 | Hono + Workers | 8h | [part1-i](./cloudflare-migration-phase2-part1-i.md) |
| Phase 2-1-ii | Day 6-7 | 対戦履歴CRUD API | 8h | [part1-ii](./cloudflare-migration-phase2-part1-ii.md) |
| Phase 2-2-i | Day 7 | デッキマスターAPI | 4h | [part2-i](./cloudflare-migration-phase2-part2-i.md) |
| Phase 2-2-ii | Day 8 | 統計計算API | 8h | [part2-ii](./cloudflare-migration-phase2-part2-ii.md) |
| Phase 2-3-i | Day 9 | インポートAPI | 6h | [part3-i](./cloudflare-migration-phase2-part3-i.md) |
| Phase 2-3-ii | Day 10 | APIテスト・最適化 | 6h | [part3-ii](./cloudflare-migration-phase2-part3-ii.md) |
| Phase 3-1-i | Day 11 | Vite + React 19 | 6h | [part1-i](./cloudflare-migration-phase3-part1-i.md) |
| Phase 3-1-ii | Day 11-12 | Zustand状態管理 | 10h | [part1-ii](./cloudflare-migration-phase3-part1-ii.md) |
| Phase 3-2-i | Day 12-13 | API接続・対戦履歴UI | 12h | [part2-i](./cloudflare-migration-phase3-part2-i.md) |
| Phase 3-2-ii | Day 14-15 | 統計・レスポンシブ・E2E | 12h | [part2-ii](./cloudflare-migration-phase3-part2-ii.md) |
| Phase 4-1 | Day 16-17前半 | 認証設定・フロー | 14h | [part1](./cloudflare-migration-phase4-part1.md) |
| Phase 4-2 | Day 17後半 | パフォーマンス最適化 | 4h | [part2](./cloudflare-migration-phase4-part2.md) |
| Phase 4-3 | Day 18 | CI/CD・デプロイ | 6h | [part3](./cloudflare-migration-phase4-part3.md) |

**合計**: 24パート、144時間（すべて500行以下）

## タスク番号管理

- **使用済み番号**: TASK-0021 ~ TASK-0042 (22タスク)
- **次回開始番号**: TASK-0043
- **最終更新日**: 2025-11-26

## マイルストーン

- [ ] **M1: Cloudflare基盤構築完了** (Phase 1終了時)
  - Cloudflare Pages/Workers環境セットアップ完了
  - D1データベース設計・マイグレーション実装完了
  - Drizzle ORM統合完了
  - ローカル開発環境での動作確認完了
  - ※R2は使用しない方針に変更

- [ ] **M2: バックエンドAPI完成** (Phase 2終了時)
  - Hono APIフレームワーク実装完了
  - 対戦履歴CRUD API実装完了
  - デッキマスターAPI実装完了
  - 統計計算API実装完了
  - インポートAPI実装完了
  - 全APIエンドポイントの単体テスト完了

- [ ] **M3: フロントエンド移行完成** (Phase 3終了時)
  - React 19.x + Vite 6.x移行完了
  - Cloudflare Pages統合完了
  - APIクライアント実装完了
  - UIコンポーネント移行完了
  - E2Eテスト完了

- [ ] **M4: 基本機能リリース可能** (Phase 3終了時)
  - 基本機能すべて実装完了
  - テストすべて合格
  - Cloudflare環境デプロイ成功
  - パフォーマンス要件達成 (3秒以内)

- [ ] **M5: 認証機能実装完了** (Phase 4中間)
  - Cloudflare Access設定完了
  - フロントエンド認証フロー実装完了
  - バックエンド認証検証実装完了
  - ユーザーデータ分離機能実装完了

- [ ] **M6: Phase 4 (最適化版) リリース可能** (Phase 4終了時)
  - マイデッキ管理機能実装完了
  - デッキマスター管理機能実装完了
  - エクスポート機能実装完了
  - キャッシュ戦略実装完了
  - 全機能テスト合格

## 技術スタック

### フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---|---|---|---|
| フレームワーク | React | 19.x | UIライブラリ |
| ビルドツール | Vite | 6.x | 高速開発サーバー・ビルド |
| 言語 | TypeScript | 5.7+ | 型安全性確保 |
| 状態管理 | Zustand | 最新 | 軽量状態管理 |
| スタイリング | Tailwind CSS | v4 | ユーティリティファーストCSS |
| ルーティング | React Router | v7 | SPA ルーティング |
| HTTPクライアント | Axios | 最新 | API通信 |
| グラフライブラリ | Recharts | 最新 | 統計グラフ描画 |
| テスト | Vitest + React Testing Library | 最新 | 単体テスト |
| E2Eテスト | Playwright | 最新 | E2Eテスト |
| リンター・フォーマッター | Biome | 最新 | コード品質管理 |

### バックエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---|---|---|---|
| 実行環境 | Cloudflare Workers | - | エッジコンピューティング |
| 言語 | TypeScript | 5.7+ | 型安全性確保 |
| フレームワーク | Hono | 最新 | 軽量Webフレームワーク |
| ORM | Drizzle ORM | 最新 | TypeScript-first ORM |
| バリデーション | Zod | 最新 | TypeScript-first スキーマ検証 |
| テスト | Vitest | 最新 | 単体テスト |
| リンター・フォーマッター | Biome | 最新 | コード品質管理 |

### インフラ・デプロイ

| カテゴリ | 技術 | 用途 |
|---|---|---|
| ホスティング | Cloudflare Pages | フロントエンド配信 |
| API | Cloudflare Workers | サーバーレスバックエンド |
| データベース | Cloudflare D1 | SQLiteベースDB |
| 認証 | Cloudflare Access | 認証・アクセス制御 |
| CI/CD | GitHub Actions | 自動テスト・デプロイ |
| 監視 | Cloudflare Analytics | ログ・メトリクス |

> **注記**: R2 (オブジェクトストレージ) は使用しない方針に変更しました。バックアップはD1の自動バックアップ機能を利用します。

### 開発環境

| カテゴリ | 技術 | 用途 |
|---|---|---|
| パッケージマネージャー | pnpm | Node.js パッケージ管理 |
| バージョン管理 | Git + GitHub | ソースコード管理 |
| ローカル開発 | Wrangler | Cloudflare開発CLI |
| IDE | VS Code (推奨) | コーディング環境 |
| ブラウザ開発ツール | Chrome DevTools | デバッグ |

## データ設計

### Cloudflare D1データベース構造

#### テーブル定義

**battle_logs** (対戦履歴)
```sql
CREATE TABLE battle_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  date TEXT NOT NULL,
  battle_type TEXT NOT NULL,
  rank TEXT,
  group_name TEXT,
  my_deck_id TEXT NOT NULL,
  turn TEXT NOT NULL,
  result TEXT NOT NULL,
  opponent_deck_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (my_deck_id) REFERENCES my_decks(id),
  FOREIGN KEY (opponent_deck_id) REFERENCES deck_master(id)
);
```

**deck_master** (デッキマスター)
```sql
CREATE TABLE deck_master (
  id TEXT PRIMARY KEY,
  deck_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**my_decks** (マイデッキ)
```sql
CREATE TABLE my_decks (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  deck_code TEXT NOT NULL,
  deck_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### ~~Cloudflare R2バケット構造~~ (使用しない)

> **注記**: R2は使用しない方針に変更しました。エクスポート/インポートはD1から直接レスポンスを返す方式で実装します。

### データモデル

#### BattleLog (対戦履歴)

```typescript
interface BattleLog {
  id: string;                     // 一意識別子
  userId?: string;                // ユーザーID (認証後)
  date: string;                   // 対戦日 (YYYY-MM-DD)
  battleType: BattleType;         // 対戦タイプ
  rank: Rank;                     // ランク
  group: Group;                   // グループ
  myDeckId: string;               // マイデッキID
  turn: Turn;                     // 先行/後攻
  result: BattleResult;           // 勝敗
  opponentDeckId: string;         // 相手デッキID
  createdAt: string;              // 作成日時 (ISO 8601)
  updatedAt: string;              // 更新日時 (ISO 8601)
}

type BattleType = "ランクマッチ" | "対戦台" | "ロビー大会";
type Rank = "サファイア" | "ダイアモンド" | "ルビー" | "トパーズ" | "-";
type Group = "A" | "AA" | "AAA" | "Master" | "-";
type Turn = "先攻" | "後攻";
type BattleResult = "勝ち" | "負け";
```

#### DeckMaster (デッキマスター)

```typescript
interface DeckMaster {
  id: string;                     // 一意識別子
  deckName: string;               // デッキ名 (例: "進化ロイヤル")
  createdAt: string;              // 作成日時 (ISO 8601)
  updatedAt: string;              // 更新日時 (ISO 8601)
}
```

#### MyDeck (マイデッキ)

```typescript
interface MyDeck {
  id: string;                     // 一意識別子
  userId?: string;                // ユーザーID (認証後)
  deckCode: string;               // デッキコード
  deckName: string;               // デッキ名
  isActive: boolean;              // 使用中フラグ
  createdAt: string;              // 作成日時 (ISO 8601)
  updatedAt: string;              // 更新日時 (ISO 8601)
}
```

## 開発プロセス

### TDDタスク実行フロー

TDD (Test-Driven Development) を適用するタスクでは、以下の手順で進めます。

1. **`/tsumiki:tdd-requirements`** - 詳細要件定義
   - 実装する機能の詳細要件を定義
   - 受け入れ基準を明確化

2. **`/tsumiki:tdd-testcases`** - テストケース作成
   - 要件から包括的なテストケースを洗い出し
   - 正常系・異常系・境界値をカバー

3. **`/tsumiki:tdd-red`** - テスト実装 (失敗)
   - 失敗するテストケースを実装
   - 実装すべき機能を明確に定義

4. **`/tsumiki:tdd-green`** - 最小実装
   - テストを通すための最小限の実装
   - すべてのテストが成功することを確認

5. **`/tsumiki:tdd-refactor`** - リファクタリング
   - コード品質の改善
   - 重複排除、可読性向上
   - テストが継続して成功することを確認

6. **`/tsumiki:tdd-verify-complete`** - 品質確認
   - すべてのテストが合格していることを確認
   - カバレッジ確認
   - 型安全性確認
   - ゼロ警告ポリシー確認

### DIRECTタスク実行フロー

DIRECT (Direct Implementation) を適用するタスクでは、以下の手順で進めます。

1. **`/tsumiki:direct-setup`** - 直接実装・設定
   - 環境構築
   - 設定ファイル作成
   - 依存関係インストール
   - 初期コード実装

2. **`/tsumiki:direct-verify`** - 動作確認・品質確認
   - 実装した機能の動作確認
   - 設定の妥当性確認
   - ドキュメント整合性確認
   - エラーがないことを確認

### タスクタイプの使い分け

| タスクタイプ | 適用対象 | 理由 |
|---|---|---|
| **TDD** | ビジネスロジック | 品質保証・回帰テスト防止・仕様の明確化 |
| | データ変換・計算処理 | アルゴリズムの正確性保証 |
| | バリデーション処理 | すべてのケースのテスト |
| | API エンドポイント | 入出力の整合性保証 |
| **DIRECT** | 環境構築・初期設定 | テスト不要な一度きりの作業 |
| | 設定ファイル作成 | 手動確認で十分 |
| | パッケージインストール | ツールによる自動確認 |
| | UI コンポーネント (初期) | ビジュアル確認が主体 |

## 各フェーズの詳細

### Phase 1: 基盤構築・データレイヤー (Day 1-5, 40時間)

**目標**: Cloudflare環境を構築し、データレイヤーを実装する

**主要タスク**:
- Cloudflare環境セットアップ (Pages, Workers, D1)
- Drizzle ORM統合・スキーマ定義
- D1マイグレーションスクリプト作成
- Azureからのデータ移行スクリプト作成
- 共通型定義・バリデーションスキーマ (Zod)
- ローカル開発環境構築 (Wrangler)

**成果物**:
- 動作するCloudflare開発環境
- D1データベース (マイグレーション済み)
- データ移行完了
- ローカル開発サーバーの起動確認

**詳細**:
- [Part 1a-i: Cloudflareアカウント・Node.js](./cloudflare-migration-phase1-part1a-i.md)
- [Part 1a-ii: Wrangler・backend環境](./cloudflare-migration-phase1-part1a-ii.md)
- [Part 1b: D1データベース・スキーマ](./cloudflare-migration-phase1-part1b.md)
- [Part 2-i: Drizzle ORM統合](./cloudflare-migration-phase1-part2-i.md)
- [Part 2-ii: R2バケット・ヘルパー](./cloudflare-migration-phase1-part2-ii.md)
- [Part 3a-i: リポジトリ基盤・Battles](./cloudflare-migration-phase1-part3a-i.md)
- [Part 3a-ii: DecksMaster・Statistics](./cloudflare-migration-phase1-part3a-ii.md)
- [Part 3b-i: JSONデータ分析・マイグレ](./cloudflare-migration-phase1-part3b-i.md)
- [Part 3b-ii: データ検証・バックアップ](./cloudflare-migration-phase1-part3b-ii.md)
- [Part 4-i: 環境変数・型定義](./cloudflare-migration-phase1-part4-i.md)
- [Part 4-ii: ローカル開発サーバー](./cloudflare-migration-phase1-part4-ii.md)

---

### Phase 2: バックエンドAPI実装 (Day 6-10, 40時間)

**目標**: Hono + Cloudflare WorkersでAPIエンドポイントを実装する

**主要タスク**:
- Hono APIフレームワークセットアップ
- 対戦履歴CRUD API (GET/POST/DELETE)
- 対戦履歴詳細取得API (GET by ID)
- デッキマスター取得API
- 統計計算API (期間別・デッキ別・ランク別)
- データインポートAPI (JSON/CSV)
- API エラーハンドリング実装
- 単体テスト (Vitest)

**成果物**:
- 完全に動作するRESTful API (Hono)
- 包括的な単体テスト (カバレッジ70%以上)
- API ドキュメント
- Workers統合完了

**詳細**:
- [Part 1-i: Hono + Workers](./cloudflare-migration-phase2-part1-i.md)
- [Part 1-ii: 対戦履歴CRUD API](./cloudflare-migration-phase2-part1-ii.md)
- [Part 2-i: デッキマスターAPI](./cloudflare-migration-phase2-part2-i.md)
- [Part 2-ii: 統計計算API](./cloudflare-migration-phase2-part2-ii.md)
- [Part 3-i: インポートAPI](./cloudflare-migration-phase2-part3-i.md)
- [Part 3-ii: APIテスト・最適化](./cloudflare-migration-phase2-part3-ii.md)

---

### Phase 3: フロントエンド移行 (Day 11-15, 40時間)

**目標**: React 19.x + Vite 6.xに移行し、Cloudflare Pagesに統合する

**主要タスク**:
- React 19.x + Vite 6.x プロジェクトセットアップ
- Cloudflare Pages統合
- Zustand 状態管理移行
- 対戦履歴登録フォーム移行
- 対戦履歴一覧・詳細表示移行
- 統計ダッシュボード移行 (Recharts)
- データインポート機能移行
- レスポンシブデザイン調整
- E2Eテスト (Playwright)

**成果物**:
- React 19.x + Vite 6.x アプリケーション
- Cloudflare Pages統合完了
- レスポンシブデザイン
- E2Eテストスイート
- デプロイ可能なアプリケーション

**詳細**:
- [Part 1-i: Vite + React 19](./cloudflare-migration-phase3-part1-i.md)
- [Part 1-ii: Zustand状態管理](./cloudflare-migration-phase3-part1-ii.md)
- [Part 2-i: API接続・対戦履歴UI](./cloudflare-migration-phase3-part2-i.md)
- [Part 2-ii: 統計・レスポンシブ・E2E](./cloudflare-migration-phase3-part2-ii.md)

---

### Phase 4: 認証・最適化 (Day 16-18, 24時間)

**目標**: Cloudflare Access認証を実装し、パフォーマンスを最適化する

**主要タスク**:
- Cloudflare Access セットアップ
- フロントエンド認証フロー実装
- バックエンド認証検証実装
- マイデッキ管理機能 (CRUD)
- デッキマスター管理機能 (CRUD)
- データエクスポート機能 (JSON/CSV)
- キャッシュ戦略実装 (KV/Cache API)
- パフォーマンス最適化

**成果物**:
- 認証機能完備
- マイデッキ・デッキマスター管理機能
- エクスポート機能
- キャッシュ戦略実装
- デプロイ可能な最終版アプリケーション

**詳細**:
- [Part 1: 認証設定・フロー実装](./cloudflare-migration-phase4-part1.md)
- [Part 2: パフォーマンス最適化](./cloudflare-migration-phase4-part2.md)
- [Part 3: CI/CD・デプロイ](./cloudflare-migration-phase4-part3.md)

## タスク工数の見積もり根拠

### 基本工数単価

| タスク種別 | 工数/タスク | 根拠 |
|---|---|---|
| 環境構築 (DIRECT) | 4-8時間 | 初回設定、ドキュメント参照、トラブルシューティング |
| 型定義 (DIRECT) | 2-4時間 | インターフェース定義、ドキュメント整備 |
| ORMスキーマ定義 (TDD) | 4-6時間 | Drizzleスキーマ、マイグレーション、テスト |
| APIエンドポイント (TDD) | 6-8時間 | テスト、実装、バリデーション、エラーハンドリング |
| React コンポーネント (TDD) | 6-10時間 | テスト、UI実装、ロジック、スタイリング |
| E2Eテスト | 4-6時間 | シナリオ作成、テスト実装、デバッグ |
| 認証実装 (DIRECT) | 6-8時間 | Cloudflare Access設定、フロントエンド・バックエンド連携 |

### フェーズ別工数内訳

#### Phase 1 (40時間)
- Cloudflare環境セットアップ: 6時間
- Drizzle ORM統合・スキーマ定義: 6時間
- D1マイグレーションスクリプト: 4時間
- R2ストレージクライアント実装: 6時間
- データ移行スクリプト作成: 6時間
- 共通型定義・バリデーション: 4時間
- ローカル開発環境構築: 4時間
- バッファ (問題解決・ドキュメント): 4時間

#### Phase 2 (40時間)
- Hono APIフレームワークセットアップ: 4時間
- 対戦履歴CRUD API: 12時間 (4エンドポイント × 3時間)
- 統計計算API: 6時間
- データインポートAPI: 6時間
- デッキマスターAPI: 4時間
- エラーハンドリング: 4時間
- 単体テスト: 4時間

#### Phase 3 (40時間)
- React 19.x + Vite 6.x セットアップ: 4時間
- Cloudflare Pages統合: 4時間
- 状態管理 (Zustand) 移行: 4時間
- 対戦履歴登録フォーム移行: 6時間
- 対戦履歴一覧・詳細移行: 6時間
- 統計ダッシュボード移行: 6時間
- インポート機能移行: 4時間
- レスポンシブデザイン調整: 4時間
- E2Eテスト: 2時間

#### Phase 4 (24時間)
- Cloudflare Access セットアップ: 4時間
- 認証フロー実装: 6時間
- マイデッキ管理: 6時間
- デッキマスター管理: 4時間
- エクスポート機能: 2時間
- キャッシュ戦略実装: 2時間

## 品質基準

### コード品質

- **TypeScript strict mode**: すべてのコードで有効化
- **ゼロ警告ポリシー**: コンパイル警告・リンター警告ゼロ
- **テストカバレッジ**: 70%以上 (MVP段階)
- **コーディング規約**: Biome による自動チェック

### テスト

- **単体テスト**: すべてのビジネスロジック
- **統合テスト**: API エンドポイント
- **E2Eテスト**: 主要ユーザーフロー
- **テスト成功率**: 100% (すべてのテストが合格)

### パフォーマンス

- **ページ読み込み時間**: 2秒以内 (Cloudflareエッジで高速化)
- **APIレスポンスタイム**: 500ms以内 (統計APIは1秒以内)
- **同時利用者数**: 100人以上で安定動作
- **データ処理**: 10,000件のデータを快適に処理

### セキュリティ

- **HTTPS通信**: すべてのデータ通信で必須
- **環境変数管理**: APIキー・接続文字列は環境変数
- **入力バリデーション**: すべての外部入力で実施
- **認証**: Cloudflare Access による保護

### ユーザビリティ

- **直感的UI**: データ登録が3ステップ以内
- **エラーメッセージ**: 日本語で分かりやすく
- **レスポンシブデザイン**: PC・スマホで快適に操作
- **ローディング表示**: 視覚的なフィードバック

## リスクと対策

### 技術的リスク

| リスク | 影響度 | 確率 | 対策 |
|---|---|---|---|
| Cloudflare D1制限 (クエリサイズ等) | 中 | 中 | クエリ最適化、ページネーション |
| Workers実行時間制限 | 中 | 低 | 処理の分割、バックグラウンドジョブ |
| Drizzle ORM互換性問題 | 中 | 低 | 詳細ドキュメント、段階的実装 |
| Cloudflare Access 設定ミス | 高 | 中 | 詳細ドキュメント、段階的実装 |

### スケジュールリスク

| リスク | 影響度 | 確率 | 対策 |
|---|---|---|---|
| 要件変更 | 高 | 中 | 段階的リリース、フィードバックループ |
| 技術的問題による遅延 | 中 | 中 | バッファ時間確保、早期問題検知 |
| テスト不足による品質低下 | 高 | 低 | TDD厳守、自動テスト |

### 品質リスク

| リスク | 影響度 | 確率 | 対策 |
|---|---|---|---|
| バグの見落とし | 中 | 中 | TDD、コードレビュー、E2Eテスト |
| パフォーマンス問題 | 中 | 低 | 早期パフォーマンステスト、Cloudflare Analytics |
| セキュリティ脆弱性 | 高 | 低 | 依存関係更新、セキュリティスキャン |

## 制約事項

### 技術的制約

- **Cloudflare 無料枠**: Cloudflareの無料枠・低コスト枠で運用
- **D1データベース制限**: SQLiteベース、クエリサイズ制限あり
- **Workers実行時間制限**: CPU時間制限あり
- **ブラウザ対応**: モダンブラウザ最新2バージョン

### ビジネス的制約

- **個人利用**: 商用化は未定
- **開発期限**: 18営業日 (段階的リリース)
- **予算**: 最小化 (無料枠優先)

### 外部依存

- **Cloudflare サービス**: Pages, Workers, D1, Access
- **GitHub**: ソースコード管理、CI/CD
- **npm レジストリ**: パッケージ依存関係

## 関連ドキュメント

### 設計文書

- [Cloudflareベースアーキテクチャ設計](../design/cloudflare-architecture.md)
- [データフロー設計](../design/shadowverse-battle-log/dataflow.md)
- [API エンドポイント設計](../design/shadowverse-battle-log/api-endpoints.md)

### 要件定義

- [要件定義書](../spec/shadowverse-battle-log-requirements.md)
- [ユーザーストーリー](../spec/shadowverse-battle-log-user-stories.md)
- [受け入れ基準](../spec/shadowverse-battle-log-acceptance-criteria.md)

### 技術情報

- [技術スタック定義](../tech-stack.md)
- [開発ガイドライン](../../.claude/CLAUDE.md)

### フェーズ別タスク

#### Phase 1: 基盤構築・データレイヤー (11パート)
- [Part 1a-i: Cloudflareアカウント・Node.js](./cloudflare-migration-phase1-part1a-i.md) (267行)
- [Part 1a-ii: Wrangler・backend環境](./cloudflare-migration-phase1-part1a-ii.md) (339行)
- [Part 1b: D1データベース・スキーマ](./cloudflare-migration-phase1-part1b.md) (347行)
- [Part 2-i: Drizzle ORM統合](./cloudflare-migration-phase1-part2-i.md) (359行)
- [Part 2-ii: R2バケット・ヘルパー](./cloudflare-migration-phase1-part2-ii.md) (428行)
- [Part 3a-i: リポジトリ基盤・Battles](./cloudflare-migration-phase1-part3a-i.md) (337行)
- [Part 3a-ii: DecksMaster・Statistics](./cloudflare-migration-phase1-part3a-ii.md) (337行)
- [Part 3b-i: JSONデータ分析・マイグレ](./cloudflare-migration-phase1-part3b-i.md) (341行)
- [Part 3b-ii: データ検証・バックアップ](./cloudflare-migration-phase1-part3b-ii.md) (267行)
- [Part 4-i: 環境変数・型定義](./cloudflare-migration-phase1-part4-i.md) (303行)
- [Part 4-ii: ローカル開発サーバー](./cloudflare-migration-phase1-part4-ii.md) (399行)

#### Phase 2: バックエンドAPI実装 (6パート)
- [Part 1-i: Hono + Workers](./cloudflare-migration-phase2-part1-i.md) (351行)
- [Part 1-ii: 対戦履歴CRUD API](./cloudflare-migration-phase2-part1-ii.md) (410行)
- [Part 2-i: デッキマスターAPI](./cloudflare-migration-phase2-part2-i.md) (193行)
- [Part 2-ii: 統計計算API](./cloudflare-migration-phase2-part2-ii.md) (401行)
- [Part 3-i: インポートAPI](./cloudflare-migration-phase2-part3-i.md) (300行)
- [Part 3-ii: APIテスト・最適化](./cloudflare-migration-phase2-part3-ii.md) (293行)

#### Phase 3: フロントエンド移行 (4パート)
- [Part 1-i: Vite + React 19](./cloudflare-migration-phase3-part1-i.md) (254行)
- [Part 1-ii: Zustand状態管理](./cloudflare-migration-phase3-part1-ii.md) (318行)
- [Part 2-i: API接続・対戦履歴UI](./cloudflare-migration-phase3-part2-i.md) (308行)
- [Part 2-ii: 統計・レスポンシブ・E2E](./cloudflare-migration-phase3-part2-ii.md) (306行)

#### Phase 4: 認証・最適化 (3パート)
- [Part 1: 認証設定・フロー実装](./cloudflare-migration-phase4-part1.md) (423行)
- [Part 2: パフォーマンス最適化](./cloudflare-migration-phase4-part2.md) (235行)
- [Part 3: CI/CD・デプロイ](./cloudflare-migration-phase4-part3.md) (341行)

## 更新履歴

| 日付 | バージョン | 変更内容 | 更新者 |
|---|---|---|---|
| 2025-11-26 | 1.0.0 | 初版作成 | Claude Code |
| 2025-11-26 | 1.1.0 | 500行制限に基づく14パートへの分割 | Claude Code |
| 2025-11-27 | 1.2.0 | R2削除、D1のみの運用に変更 | Claude Code |
