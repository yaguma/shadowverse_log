# Shadowverse Battle Log - タスク概要

## プロジェクト概要

- **プロジェクト名**: Shadowverse Battle Log
- **開発期間**: 約28営業日 (約5.5週間)
- **総工数**: 200時間
- **総タスク数**: 25タスク
- **開発フェーズ**: Phase 1 (基本機能) + Phase 2 (認証・高度機能)
- **開発アプローチ**: TDD (ビジネスロジック) + DIRECT (環境構築・設定)

## フェーズ構成

| フェーズ | 期間 | 主な成果物 | タスク数 | 工数 | ファイル |
|---|---|---|---|---|---|
| Phase 1 | Day 1-6 | 環境構築・基盤実装 | 6 | 48h | [phase1.md](./shadowverse-battle-log-phase1.md) |
| Phase 2 | Day 7-13 | バックエンドAPI実装 | 7 | 56h | [phase2.md](./shadowverse-battle-log-phase2.md) |
| Phase 3 | Day 14-21 | フロントエンド実装 | 8 | 64h | [phase3.md](./shadowverse-battle-log-phase3.md) |
| Phase 4 | Day 22-28 | 認証・高度機能 | 4 | 32h | [phase4.md](./shadowverse-battle-log-phase4.md) |

## タスク番号管理

- **使用済み番号**: なし
- **次回開始番号**: TASK-0001
- **最終更新日**: 2025-10-24

## マイルストーン

- [ ] **M1: 開発環境構築完了** (Phase 1終了時)
  - Azure環境セットアップ完了
  - 共通型定義・Blob Storageクライアント実装完了
  - ローカル開発環境での動作確認完了

- [ ] **M2: バックエンドAPI完成** (Phase 2終了時)
  - 対戦履歴CRUD API実装完了
  - デッキマスターAPI実装完了
  - 統計計算API実装完了
  - インポートAPI実装完了
  - 全APIエンドポイントの単体テスト完了

- [ ] **M3: フロントエンド基本機能完成** (Phase 3終了時)
  - 対戦履歴登録フォーム実装完了
  - 対戦履歴一覧・詳細表示実装完了
  - 統計ダッシュボード実装完了
  - インポート機能実装完了
  - E2Eテスト完了

- [ ] **M4: Phase 1 (認証なし) リリース可能** (Phase 3終了時)
  - 基本機能すべて実装完了
  - テストすべて合格
  - Azure環境デプロイ成功
  - パフォーマンス要件達成 (3秒以内)

- [ ] **M5: 認証機能実装完了** (Phase 4中間)
  - Azure AD B2C設定完了
  - フロントエンド認証フロー実装完了
  - バックエンド認証検証実装完了
  - ユーザーデータ分離機能実装完了

- [ ] **M6: Phase 2 (認証あり) リリース可能** (Phase 4終了時)
  - マイデッキ管理機能実装完了
  - デッキマスター管理機能実装完了
  - エクスポート機能実装完了
  - PWA対応完了
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
| 実行環境 | Node.js | 22.x LTS | JavaScript実行環境 |
| 言語 | TypeScript | 5.7+ | 型安全性確保 |
| フレームワーク | Azure Functions | v4 | サーバーレスAPI |
| バリデーション | Zod | 最新 | TypeScript-first スキーマ検証 |
| ストレージSDK | @azure/storage-blob | 最新 | Blob Storage アクセス |
| テスト | Jest | 最新 | 単体テスト |
| リンター・フォーマッター | Biome | 最新 | コード品質管理 |

### インフラ・デプロイ

| カテゴリ | 技術 | 用途 |
|---|---|---|
| ホスティング | Azure Static Web Apps | フロントエンド配信 |
| API | Azure Functions | サーバーレスバックエンド |
| ストレージ | Azure Blob Storage | JSONファイル管理 |
| 認証 (Phase 2) | Azure AD B2C | ユーザー認証 |
| CI/CD | GitHub Actions | 自動テスト・デプロイ |
| 監視 | Azure Application Insights | ログ・メトリクス |

### 開発環境

| カテゴリ | 技術 | 用途 |
|---|---|---|
| パッケージマネージャー | pnpm | Node.js パッケージ管理 |
| バージョン管理 | Git + GitHub | ソースコード管理 |
| IDE | VS Code (推奨) | コーディング環境 |
| ブラウザ開発ツール | Chrome DevTools | デバッグ |

## データ設計

### JSONファイル構造 (Azure Blob Storage)

#### Phase 1 (認証なし)

```
shadowverse-data/
├── battle-logs.json          # 対戦履歴データ
├── deck-master.json          # デッキマスターデータ
└── my-decks.json             # マイデッキデータ
```

#### Phase 2 (認証あり)

```
shadowverse-data/
├── {userId}/
│   ├── battle-logs.json      # ユーザー固有の対戦履歴
│   ├── my-decks.json         # ユーザー固有のマイデッキ
│   └── user-settings.json    # ユーザー設定
└── shared/
    └── deck-master.json      # 共通デッキマスター
```

### データモデル

#### BattleLog (対戦履歴)

```typescript
interface BattleLog {
  id: string;                     // 一意識別子
  date: string;                   // 対戦日 (YYYY-MM-DD)
  battleType: BattleType;         // 対戦タイプ
  rank: Rank;                     // ランク
  group: Group;                   // グループ
  myDeckId: string;               // マイデッキID
  turn: Turn;                     // 先行/後攻
  result: BattleResult;           // 勝敗
  opponentDeckId: string;         // 相手デッキID
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
}
```

#### MyDeck (マイデッキ)

```typescript
interface MyDeck {
  id: string;                     // 一意識別子
  deckCode: string;               // デッキコード
  deckName: string;               // デッキ名
  isActive: boolean;              // 使用中フラグ
  createdAt: string;              // 作成日時 (ISO 8601)
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

### Phase 1: 環境構築・基盤実装 (Day 1-6, 48時間)

**目標**: 開発環境を整備し、共通基盤を実装する

**主要タスク**:
- Azure環境セットアップ (Static Web Apps, Functions, Blob Storage)
- プロジェクト初期化 (フロントエンド・バックエンド)
- 共通型定義 (TypeScript interfaces)
- Blob Storage クライアント実装
- バリデーションスキーマ定義 (Zod)
- ユーティリティ関数実装

**成果物**:
- 動作する開発環境
- 共通ライブラリ・型定義
- Blob Storage 読み書き機能
- ローカル開発サーバーの起動確認

**詳細**: [Phase 1タスク詳細](./shadowverse-battle-log-phase1.md)

---

### Phase 2: バックエンドAPI実装 (Day 7-13, 56時間)

**目標**: すべてのAPIエンドポイントを実装し、単体テストで品質を保証する

**主要タスク**:
- 対戦履歴CRUD API (GET/POST/DELETE)
- 対戦履歴詳細取得API (GET by ID)
- デッキマスター取得API
- 統計計算API (期間別・デッキ別・ランク別)
- データインポートAPI (JSON/CSV)
- API エラーハンドリング実装
- 単体テスト (Jest)

**成果物**:
- 完全に動作するRESTful API
- 包括的な単体テスト (カバレッジ70%以上)
- API ドキュメント (OpenAPI/Swagger)

**詳細**: [Phase 2タスク詳細](./shadowverse-battle-log-phase2.md)

---

### Phase 3: フロントエンド実装 (Day 14-21, 64時間)

**目標**: ユーザーインターフェースを実装し、E2Eテストで動作を確認する

**主要タスク**:
- React アプリケーションセットアップ (Vite)
- Zustand 状態管理セットアップ
- 対戦履歴登録フォーム (ダイアログ、前回値引き継ぎ)
- 対戦履歴一覧・詳細表示
- 統計ダッシュボード (Recharts グラフ)
- データインポート機能 (ファイルアップロード)
- レスポンシブデザイン (PC・スマホ対応)
- E2Eテスト (Playwright)

**成果物**:
- 完全に動作するSPAアプリケーション
- レスポンシブデザイン
- E2Eテストスイート
- デプロイ可能な Phase 1 (認証なし) バージョン

**詳細**: [Phase 3タスク詳細](./shadowverse-battle-log-phase3.md)

---

### Phase 4: 認証・高度機能 (Day 22-28, 32時間)

**目標**: Azure AD B2C認証を実装し、高度機能を追加する

**主要タスク**:
- Azure AD B2C セットアップ
- フロントエンド認証フロー実装 (MSAL)
- バックエンド認証検証実装 (JWT)
- マイデッキ管理機能 (CRUD)
- デッキマスター管理機能 (CRUD)
- データエクスポート機能 (JSON/CSV)
- PWA 対応 (manifest.json, service worker)

**成果物**:
- 認証機能完備
- マイデッキ・デッキマスター管理機能
- エクスポート機能
- PWA対応アプリケーション
- デプロイ可能な Phase 2 (認証あり) バージョン

**詳細**: [Phase 4タスク詳細](./shadowverse-battle-log-phase4.md)

## タスク工数の見積もり根拠

### 基本工数単価

| タスク種別 | 工数/タスク | 根拠 |
|---|---|---|
| 環境構築 (DIRECT) | 4-8時間 | 初回設定、ドキュメント参照、トラブルシューティング |
| 型定義 (DIRECT) | 2-4時間 | インターフェース定義、ドキュメント整備 |
| ユーティリティ実装 (TDD) | 4-6時間 | テストケース作成、実装、リファクタリング |
| APIエンドポイント (TDD) | 6-8時間 | テスト、実装、バリデーション、エラーハンドリング |
| React コンポーネント (TDD) | 6-10時間 | テスト、UI実装、ロジック、スタイリング |
| E2Eテスト | 4-6時間 | シナリオ作成、テスト実装、デバッグ |
| 認証実装 (DIRECT) | 8-12時間 | Azure設定、フロントエンド・バックエンド連携 |

### フェーズ別工数内訳

#### Phase 1 (48時間)
- Azure環境セットアップ: 8時間
- プロジェクト初期化 (フロントエンド・バックエンド): 6時間
- 共通型定義: 4時間
- Blob Storage クライアント実装: 8時間
- バリデーションスキーマ定義: 6時間
- ユーティリティ関数実装: 6時間
- ローカル開発環境確認: 2時間
- バッファ (問題解決・ドキュメント): 8時間

#### Phase 2 (56時間)
- 対戦履歴CRUD API: 16時間 (4エンドポイント × 4時間)
- 統計計算API: 8時間
- データインポートAPI: 8時間
- デッキマスターAPI: 4時間
- エラーハンドリング: 6時間
- 単体テスト: 10時間
- バッファ: 4時間

#### Phase 3 (64時間)
- React セットアップ: 6時間
- 状態管理 (Zustand): 4時間
- 対戦履歴登録フォーム: 10時間
- 対戦履歴一覧・詳細: 10時間
- 統計ダッシュボード: 12時間
- インポート機能: 8時間
- レスポンシブデザイン: 6時間
- E2Eテスト: 6時間
- バッファ: 2時間

#### Phase 4 (32時間)
- Azure AD B2C セットアップ: 6時間
- 認証フロー実装: 8時間
- マイデッキ管理: 8時間
- デッキマスター管理: 4時間
- エクスポート機能: 4時間
- PWA対応: 2時間

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

- **ページ読み込み時間**: 3秒以内 (NFR-001)
- **APIレスポンスタイム**: 1秒以内 (統計APIは3秒以内)
- **同時利用者数**: 10人以下で安定動作 (NFR-002)
- **データ処理**: 1,000件のデータを快適に処理 (NFR-003)

### セキュリティ

- **HTTPS通信**: すべてのデータ通信で必須 (NFR-101)
- **環境変数管理**: APIキー・接続文字列は環境変数 (NFR-102)
- **入力バリデーション**: すべての外部入力で実施 (NFR-103)
- **認証**: Azure AD B2C による保護 (Phase 2, NFR-104)

### ユーザビリティ

- **直感的UI**: データ登録が3ステップ以内 (NFR-201)
- **エラーメッセージ**: 日本語で分かりやすく (NFR-202)
- **レスポンシブデザイン**: PC・スマホで快適に操作 (NFR-203)
- **ローディング表示**: 視覚的なフィードバック (NFR-204)

## リスクと対策

### 技術的リスク

| リスク | 影響度 | 確率 | 対策 |
|---|---|---|---|
| Azure Functions Cold Start | 中 | 高 | Warm-up関数、キャッシュ戦略 |
| Blob Storage 障害 | 高 | 低 | リトライ機構、エラーハンドリング |
| ブラウザ互換性問題 | 中 | 中 | ポリフィル、クロスブラウザテスト |
| パフォーマンス劣化 (大量データ) | 中 | 中 | ページネーション、仮想スクロール |
| Azure AD B2C 設定ミス | 高 | 中 | 詳細ドキュメント、段階的実装 |

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
| パフォーマンス問題 | 中 | 中 | 早期パフォーマンステスト |
| セキュリティ脆弱性 | 高 | 低 | 依存関係更新、セキュリティスキャン |

## 制約事項

### 技術的制約

- **Azure 無料枠**: Azureの無料枠・低コスト枠で運用
- **JSON ファイルベース**: データベース不使用 (MVP段階)
- **個人開発**: 1人での開発を想定
- **ブラウザ対応**: モダンブラウザ最新2バージョン

### ビジネス的制約

- **個人利用**: 商用化は未定
- **開発期限**: 明確な期限なし (段階的リリース)
- **予算**: 最小化 (無料枠優先)

### 外部依存

- **Azure サービス**: Static Web Apps, Functions, Blob Storage, AD B2C
- **GitHub**: ソースコード管理、CI/CD
- **npm レジストリ**: パッケージ依存関係

## 関連ドキュメント

### 設計文書

- [アーキテクチャ設計](../design/shadowverse-battle-log/architecture.md)
- [データフロー設計](../design/shadowverse-battle-log/dataflow.md)
- [API エンドポイント設計](../design/shadowverse-battle-log/api-endpoints.md)
- [Blob Storage 設計](../design/shadowverse-battle-log/blob-storage-design.md)

### 要件定義

- [要件定義書](../spec/shadowverse-battle-log-requirements.md)
- [ユーザーストーリー](../spec/shadowverse-battle-log-user-stories.md)
- [受け入れ基準](../spec/shadowverse-battle-log-acceptance-criteria.md)

### 技術情報

- [技術スタック定義](../tech-stack.md)
- [開発ガイドライン](../../.claude/CLAUDE.md)

### フェーズ別タスク

- [Phase 1: 環境構築・基盤実装](./shadowverse-battle-log-phase1.md)
- [Phase 2: バックエンドAPI実装](./shadowverse-battle-log-phase2.md)
- [Phase 3: フロントエンド実装](./shadowverse-battle-log-phase3.md)
- [Phase 4: 認証・高度機能](./shadowverse-battle-log-phase4.md)

## 更新履歴

| 日付 | バージョン | 変更内容 | 更新者 |
|---|---|---|---|
| 2025-10-24 | 1.0.0 | 初版作成 | Claude Code |

---

**次のステップ**: 各フェーズの詳細タスクファイルを作成してください。

- [ ] [Phase 1タスク詳細](./shadowverse-battle-log-phase1.md) を作成
- [ ] [Phase 2タスク詳細](./shadowverse-battle-log-phase2.md) を作成
- [ ] [Phase 3タスク詳細](./shadowverse-battle-log-phase3.md) を作成
- [ ] [Phase 4タスク詳細](./shadowverse-battle-log-phase4.md) を作成
