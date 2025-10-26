# シャドウバース対戦履歴管理アプリケーション

## 概要

Shadowverse（シャドウバース）の対戦履歴を登録・管理・分析できるWebアプリケーションです。
対戦データの記録、一覧表示、CSV/JSON形式でのエクスポート機能を提供します。

## 主要機能

- ✅ 対戦履歴の登録（リーダー、対戦結果、先攻/後攻、勝敗など）
- ✅ 対戦履歴一覧表示（直近1週間の100件）
- ✅ データのCSV/JSON形式エクスポート
- ✅ マスターデータ管理（リーダー、フォーマット、ランク）
- 📋 統計・分析機能（計画中）
- 📋 フィルタリング・検索機能（計画中）

## 技術スタック

### バックエンド
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.x
- **Framework**: Azure Functions v4 (HTTP Trigger)
- **Storage**: Azure Blob Storage (JSON/CSV)
- **API Style**: RESTful API

### フロントエンド
- **Framework**: Vue.js 3 (Composition API)
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **State Management**: Pinia
- **UI Components**: Vuetify 3
- **HTTP Client**: Axios

### 開発ツール
- **Package Manager**: npm
- **Linter**: ESLint
- **Formatter**: Prettier
- **Testing**: Vitest (計画中)

## プロジェクト構成

```
shadowverse_log/
├── backend/              # Azure Functions バックエンド
│   ├── src/
│   │   ├── functions/   # Azure Functions定義
│   │   ├── routes/      # ルーティング処理
│   │   ├── services/    # ビジネスロジック
│   │   └── types/       # TypeScript型定義
│   ├── host.json
│   └── package.json
│
├── frontend/            # Vue.js 3 フロントエンド
│   ├── src/
│   │   ├── components/  # Vueコンポーネント
│   │   ├── views/       # ページコンポーネント
│   │   ├── stores/      # Piniaストア
│   │   ├── services/    # API通信
│   │   ├── router/      # Vue Router設定
│   │   └── types/       # TypeScript型定義
│   └── package.json
│
├── data/                # データストレージ
│   ├── json/           # JSON形式データ
│   └── csv/            # CSV形式データ
│
├── docs/                # プロジェクトドキュメント
│   ├── design/         # 設計ドキュメント
│   ├── spec/           # 仕様書
│   └── tasks/          # タスク管理
│
└── README.md
```

## セットアップ手順

### 前提条件

- Node.js 20.x 以上
- npm 9.x 以上
- Azure Functions Core Tools 4.x（バックエンド開発時）

### バックエンドのセットアップ

```bash
cd backend
npm install
npm run dev
```

バックエンドは `http://localhost:7071` で起動します。

### フロントエンドのセットアップ

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 開発コマンド

### バックエンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check
```

### フロントエンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リント
npm run lint

# 型チェック
npm run type-check

# テスト実行
npm run test
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/health` | GET | ヘルスチェック |
| `/api/battle-logs` | GET | 対戦履歴一覧取得 |
| `/api/battle-logs` | POST | 対戦履歴登録 |
| `/api/export/csv` | GET | CSV形式エクスポート |
| `/api/export/json` | GET | JSON形式エクスポート |
| `/api/master` | GET | マスターデータ取得 |

## プロジェクトフェーズ

### Phase 1: MVP開発（完了予定）
- ✅ 基本的なCRUD機能
- ✅ データエクスポート機能
- ✅ マスターデータ管理

### Phase 2: 機能拡張（計画中）
- 統計・分析ダッシュボード
- フィルタリング・検索機能
- デッキ編成管理
- ユーザー認証・認可

### Phase 3: 最適化（計画中）
- パフォーマンスチューニング
- キャッシング戦略
- エラーハンドリング強化
- テストカバレッジ向上

## ライセンス

Private Project - All Rights Reserved

## 開発者

このプロジェクトは個人開発プロジェクトです。

## 参考資料

プロジェクトの詳細な設計・仕様については `/docs` ディレクトリ配下のドキュメントを参照してください。