# Shadowverse Battle Log - 開発ガイドライン

## プロジェクト概要

Shadowverse Battle Logは、Shadowverseカードゲームのバトルデータを記録・分析するフルスタックWebアプリケーションです。プレイヤーはバトルを記録し、デッキを管理し、パフォーマンス統計を閲覧できます。

## アーキテクチャ

このプロジェクトは**DDD（ドメイン駆動設計）とクリーンアーキテクチャ**に従います。

### モノレポ構造

```
shadowverse-log/
├── apps/
│   ├── web/          # React フロントエンド
│   └── api/          # Cloudflare Workers バックエンド
├── packages/
│   └── shared/       # 共有型定義、バリデーション、ユーティリティ
└── docs/             # プロジェクトドキュメント
```

### 主要な設計パターン

1. **リポジトリパターン**: インターフェースの背後でデータアクセスを抽象化
2. **ユースケースパターン**: 各ビジネス操作は個別のユースケース
3. **Zustand Store パターン**: 状態管理の分離（battleLogStore, deckStore, statisticsStore）
4. **共有バリデーション**: Zodスキーマをフロントエンド・バックエンドで共有

## 技術スタック

### フロントエンド (apps/web)
- **フレームワーク**: React 19 + React Router 7
- **ビルドツール**: Vite 7
- **状態管理**: Zustand（persist middleware付き）
- **スタイリング**: Tailwind CSS 4
- **チャート**: Recharts
- **HTTPクライアント**: Axios（カスタムラッパー）
- **テスト**: Vitest + @testing-library/react + Playwright
- **リンター**: Biome

### バックエンド (apps/api)
- **ランタイム**: Cloudflare Workers（サーバーレス）
- **フレームワーク**: Hono
- **データベース**: Cloudflare D1（SQLite）
- **ORM**: Drizzle ORM
- **バリデーション**: Zod
- **認証**: José（Cloudflare Access JWT検証）
- **テスト**: Vitest
- **リンター**: Biome

### 共有パッケージ (packages/shared)
- **型定義**: BattleLog, DeckMaster, MyDeck, Statistics
- **バリデーション**: Zodスキーマ
- **定数**: 共有定数
- **ユーティリティ**: 日付処理、エラーハンドリング

## コアビジネスエンティティ

- **BattleLog**: プレイヤーのバトル記録（日付、バトルタイプ、ランク、結果、デッキ、ターン数）
- **DeckMaster**: マスターデッキ定義（クラス名、デッキ名、説明）
- **MyDeck**: ユーザーの個人デッキインスタンス（デッキコード、DeckMasterとの関連付け）
- **Statistics**: バトルログから算出される分析データ

## API設計

一貫したレスポンス形式のRESTfulエンドポイント：

```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

エラーレスポンス：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザーフレンドリーなメッセージ"
  },
  "meta": { ... }
}
```

## ディレクトリ構造

### フロントエンド (apps/web/src)
```
src/
├── api/              # API通信層（client.ts, deck-master.ts, my-deck.ts, statistics.ts）
├── auth/             # 認証コンテキスト
├── components/
│   ├── layout/       # Header, Navigation
│   ├── battle-log/   # バトルログUI
│   ├── deck-master/  # デッキマスター管理
│   ├── my-deck/      # ユーザーデッキ
│   ├── statistics/   # チャート・ダッシュボード
│   ├── auth/         # 認証コンポーネント
│   └── common/       # 再利用可能コンポーネント
├── pages/            # ページコンポーネント
├── store/            # Zustand ストア
├── types/            # フロントエンド固有の型
├── hooks/            # カスタムフック
├── utils/            # ユーティリティ関数
└── __tests__/        # テストファイル
```

### バックエンド (apps/api/src)
```
src/
├── db/
│   ├── schema/       # Drizzle ORMテーブル定義
│   ├── repositories/ # リポジトリ層（CRUD操作）
│   └── migrations/   # データベースマイグレーション
├── routes/           # APIルート（battle-logs, deck-master, my-decks, statistics）
├── middleware/       # 認証、レート制限
├── services/         # ビジネスロジック
├── types/            # バックエンド固有の型
└── utils/            # ユーティリティ関数
```

## 開発コマンド

```bash
# 開発
pnpm dev              # web と api を並列実行
pnpm dev:web          # フロントエンドのみ
pnpm dev:api          # バックエンドのみ

# ビルド
pnpm build            # 全パッケージをビルド
pnpm build:shared     # 共有パッケージのみビルド

# テスト
pnpm test             # 全テスト実行（--オプションは使用不可）
pnpm test:web         # フロントエンドテスト
pnpm test:api         # バックエンドテスト
pnpm test:e2e         # E2Eテスト（Playwright）

# コード品質
pnpm lint             # 全パッケージをリント
pnpm format           # コードフォーマット
pnpm type-check       # 型チェック

# データベース
pnpm db:generate      # マイグレーション生成
pnpm db:migrate       # マイグレーション実行
pnpm db:studio        # Drizzle Studio起動
```

## テスト戦略

このプロジェクトは**TDD（テスト駆動開発）**と**ゼロ警告ポリシー**に従います。

### テストの種類
- **ユニットテスト**: Vitest（happy-dom環境）
- **コンポーネントテスト**: @testing-library/react
- **E2Eテスト**: Playwright
- **カバレッジ**: V8プロバイダー、HTML/JSONレポート

### テストファイルの配置
- ソースと同じ場所に配置（`*.test.tsx`, `*.test.ts`）
- 統合テストは `src/__tests__/integration/` に配置

## コード品質基準

### 必須ルール
- **型安全性**: `any`型を使用しない厳密なTypeScript
- **ゼロ警告ポリシー**: TypeScript strict mode、Biome recommended rules
- **命名規則**: 変数・関数はcamelCase、コンポーネント・クラスはPascalCase
- **タスク参照**: 機能追跡にはTASK-XXXX識別子を使用

### Biome設定
- インデント: 2スペース
- 行幅: 100文字
- クォート: シングルクォート
- インポート: 自動整理

## 重要な設計上の決定

1. **Cloudflareプラットフォーム**: Workers（サーバーレス）+ D1（SQLite）でコスト効率化
2. **Drizzle ORM**: 型安全でSQL風の構文
3. **Zustand**: ボイラープレートなしの軽量状態管理
4. **Hono**: Workers向けの軽量Webフレームワーク
5. **モノレポ**: 共有型でフロントエンド・バックエンドの乖離を防止
6. **Zod**: TypeScript推論付きランタイムスキーマバリデーション
7. **Biome**: ESLint + Prettierの代替となる高速な統合ツール

## フロントエンドガイドライン

- Reactコンポーネントは関数コンポーネントを使用
- 状態管理にはZustandストアを使用
- スタイリングにはTailwind CSSを使用
- 適切なローディングとエラー状態を実装
- モバイルファーストのレスポンシブデザインを確保
- コード分割とlazy loadingでパフォーマンス最適化

## バックエンドガイドライン

- リポジトリパターンでデータアクセスを抽象化
- Zodスキーマで入力バリデーション
- 適切なエラーハンドリングと一貫したレスポンス形式
- Cloudflare Accessによる認証
- ページネーションサポート（PaginatedResult型）

## デプロイメント

- **フロントエンド**: Cloudflare Pages
- **バックエンド**: Cloudflare Workers
- **データベース**: Cloudflare D1
- **CI/CD**: GitHub Actions（lint、test、deploy）

## 環境設定

### wrangler.toml（バックエンド）
- 複数環境: development, staging, production
- D1データベースバインディング
- Cloudflare Access認証の環境変数
- 互換性フラグ: `nodejs_compat`
