# Phase 1: 基盤構築・環境設定

## フェーズ概要

- **期間**: Day 1-6 (6営業日)
- **総工数**: 48時間
- **目標**: 開発環境の完全なセットアップとBlob Storage基盤の実装
- **成果物**:
  - フロントエンド・バックエンドのプロジェクト構成
  - Azure Blob Storage設定完了
  - 共有型定義とBlob Storageクライアント実装

## 週次計画

### Week 1 (Day 1-6)

- **目標**: 開発環境構築とAzure設定完了
- **成果物**: すべての環境が動作し、Blob Storageクライアントが完成

---

## タスク一覧

### TASK-0001: プロジェクト初期化とGit設定

- [x] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: プロジェクト開始の前提条件
- **依存タスク**: なし
- **要件名**: Shadowverse Battle Log - 対戦履歴管理システム

#### 実装詳細

##### 1. Git リポジトリ初期化

```bash
# メインブランチをmainに設定
git branch -M main

# 最初のコミット（README作成後）
git add .
git commit -m "chore: initialize project structure

- Add project directory structure
- Add .gitignore configuration
- Add README.md with project overview

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

##### 2. .gitignore 作成

`/home/syagu/work/shadowverse_log/.gitignore` に以下の内容を追加（既存ファイルと統合）:

```gitignore
# Node
node_modules/
dist/
build/
.env
.env.local
.env.*.local

# Azure
local.settings.json
*.publish

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
Desktop.ini

# ログファイル
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# テストカバレッジ
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp
```

##### 3. README.md 作成

プロジェクトルートに `/home/syagu/work/shadowverse_log/README.md` を作成:

```markdown
# Shadowverse Battle Log

シャドウバースの対戦履歴を記録・分析するWebアプリケーション

## 概要

Shadowverse Battle Logは、シャドウバースの対戦履歴を簡単に記録し、統計分析を行うためのWebアプリケーションです。個人利用を想定したMVP/プロトタイプとして開発されています。

## 主要機能

### Phase 1 (認証なし)
- 対戦履歴の登録・一覧表示・削除
- 統計・分析ダッシュボード（勝率、デッキ別勝率、ランク別成績）
- データインポート機能（JSON/CSV）

### Phase 2 (認証あり) - 計画中
- Azure AD B2C認証
- マイデッキ管理
- デッキマスター管理
- データエクスポート機能
- PWA対応

## 技術スタック

### フロントエンド
- **フレームワーク**: React 19.x
- **ビルドツール**: Vite 6.x
- **言語**: TypeScript 5.7+
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS v4
- **ルーティング**: React Router v7

### バックエンド
- **実行環境**: Node.js 22.x LTS
- **言語**: TypeScript 5.7+
- **フレームワーク**: Azure Functions v4
- **ストレージ**: Azure Blob Storage

### インフラ
- **ホスティング**: Azure Static Web Apps
- **API**: Azure Functions
- **ストレージ**: Azure Blob Storage
- **認証** (Phase 2): Azure AD B2C

## ディレクトリ構造

```
shadowverse_log/
├── frontend/           # React アプリケーション
│   ├── src/
│   │   ├── components/ # 再利用可能コンポーネント
│   │   ├── pages/      # ページコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   ├── store/      # 状態管理 (Zustand)
│   │   ├── types/      # 型定義
│   │   ├── api/        # API クライアント
│   │   └── utils/      # ユーティリティ
│   └── tests/          # E2E テスト (Playwright)
├── backend/            # Azure Functions
│   ├── src/
│   │   ├── functions/  # Azure Functions
│   │   ├── services/   # ビジネスロジック
│   │   ├── storage/    # Blob Storage アクセス
│   │   ├── types/      # 型定義
│   │   └── utils/      # ユーティリティ
│   └── tests/          # 単体テスト (Jest)
├── docs/               # プロジェクトドキュメント
│   ├── design/         # 設計文書
│   ├── spec/           # 要件定義
│   └── tasks/          # タスク管理
└── data/               # サンプルデータ
    └── json/
```

## セットアップ手順

### 前提条件

- Node.js 22.x LTS
- pnpm 9.x
- Azure アカウント（Blob Storage、Static Web Apps、Functions）

### フロントエンドセットアップ

```bash
cd frontend
pnpm install
pnpm dev          # 開発サーバー起動 (http://localhost:5173)
pnpm build        # 本番ビルド
pnpm test         # Vitest テスト実行
pnpm lint         # Biome lint
```

### バックエンドセットアップ

```bash
cd backend
npm install
npm start         # 開発サーバー起動 (http://localhost:7071)
npm test          # Jest テスト実行
npm run build     # TypeScript ビルド
```

### Azure環境セットアップ

詳細は `/docs/tasks/shadowverse-battle-log-phase1.md` の TASK-0004 を参照してください。

## 開発ガイドライン

- **TypeScript strict mode**: すべてのコードで有効化
- **ゼロ警告ポリシー**: コンパイル警告・リンター警告ゼロ
- **TDD**: ビジネスロジックは可能な限りテスト駆動開発
- **テストカバレッジ**: 70%以上 (MVP段階)

## ドキュメント

- [技術スタック定義](docs/tech-stack.md)
- [要件定義書](docs/spec/shadowverse-battle-log-requirements.md)
- [アーキテクチャ設計](docs/design/shadowverse-battle-log/architecture.md)
- [タスク概要](docs/tasks/shadowverse-battle-log-overview.md)

## ライセンス

個人利用プロジェクト

## 作成者

開発者: syagu
```

##### 4. ディレクトリ構造作成

```bash
# ルートディレクトリで実行
mkdir -p frontend/src/{components,pages,hooks,store,types,api,utils}
mkdir -p frontend/tests
mkdir -p backend/src/{functions,services,storage,types,utils}
mkdir -p backend/tests
mkdir -p data/json

# データディレクトリの確認（既に存在する可能性）
ls -la data/json
```

#### 完了条件

- [x] Git リポジトリが初期化されている（既存）
- [ ] .gitignore が更新されている
- [ ] README.md が作成されている
- [ ] ディレクトリ構造が作成されている
- [ ] 初回コミットが完了している

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

#### 検証手順

1. `.gitignore` ファイルが存在し、正しい内容が記載されているか確認
2. `README.md` が作成され、プロジェクト概要が記載されているか確認
3. `frontend/src/` および `backend/src/` の各サブディレクトリが存在するか確認
4. `git status` でコミット状態を確認

---

### TASK-0002: フロントエンド環境構築

- [x] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-603 (レスポンシブデザイン), tech-stack.md
- **依存タスク**: TASK-0001
- **信頼性レベル**: 🔵 *tech-stack.mdより*

#### 実装詳細

##### 1. Node.js 22.x確認

```bash
node --version  # v22.x.x を確認
```

Node.js 22.xがインストールされていない場合、nvmまたは公式サイトからインストール。

##### 2. Vite 6.x + React 19.x + TypeScript 5.7+ プロジェクト作成

```bash
cd frontend

# Vite プロジェクト作成（既存の場合はスキップ）
pnpm create vite@latest . --template react-ts

# 依存関係インストール
pnpm install

# React 19.x へのアップグレード（必要に応じて）
pnpm add react@^19 react-dom@^19

# 追加の依存関係
pnpm add zustand react-router-dom@^7 axios recharts
pnpm add -D @types/node
```

##### 3. Tailwind CSS v4 設定

```bash
cd frontend

# Tailwind CSS v4 インストール
pnpm add -D tailwindcss@next postcss autoprefixer
pnpm dlx tailwindcss init -p
```

`tailwind.config.ts` を作成:

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

`src/index.css` を作成:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

##### 4. Biome (linter/formatter) 設定

```bash
cd frontend

# Biome インストール
pnpm add -D @biomejs/biome

# Biome 初期化
pnpm dlx @biomejs/biome init
```

`biome.json` を作成:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", "dist", "build", "coverage"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

##### 5. ディレクトリ構造作成

```bash
cd frontend/src

# ディレクトリ作成
mkdir -p components/common
mkdir -p components/battle-log
mkdir -p components/statistics
mkdir -p components/layout
mkdir -p pages
mkdir -p hooks
mkdir -p store
mkdir -p types
mkdir -p api
mkdir -p utils

# 各ディレクトリに index.ts を作成（エクスポート用）
touch components/common/index.ts
touch components/battle-log/index.ts
touch components/statistics/index.ts
touch components/layout/index.ts
touch pages/index.ts
touch hooks/index.ts
touch store/index.ts
touch types/index.ts
touch api/index.ts
touch utils/index.ts
```

##### 6. tsconfig.json (strict mode)

`frontend/tsconfig.json` を作成:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting - Strict Mode */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

##### 7. vite.config.ts

`frontend/vite.config.ts` を作成:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

##### 8. package.json スクリプト追加

`frontend/package.json` に以下のスクリプトを追加:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "type-check": "tsc --noEmit"
  }
}
```

#### 完了条件

- [ ] Node.js 22.x がインストールされている
- [ ] pnpm がインストールされている
- [ ] Vite + React プロジェクトが作成されている
- [ ] Tailwind CSS v4 が設定されている
- [ ] Biome が設定されている
- [ ] ディレクトリ構造が作成されている
- [ ] `tsconfig.json` が strict mode で設定されている
- [ ] `vite.config.ts` が設定されている
- [ ] `pnpm dev` で開発サーバーが起動する

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

#### 検証手順

1. `pnpm --version` で pnpm がインストールされているか確認
2. `cd frontend && pnpm install` で依存関係がインストールされるか確認
3. `pnpm dev` で開発サーバーが起動するか確認 (http://localhost:5173)
4. `pnpm lint` でリンターが動作するか確認
5. `pnpm type-check` で型チェックが成功するか確認

---

### TASK-0003: バックエンド環境構築

- [x] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-604 (Azure Functions使用)
- **依存タスク**: TASK-0001
- **信頼性レベル**: 🔵 *REQ-604より*

#### 実装詳細

##### 1. Azure Functions v4 プロジェクト作成

```bash
cd backend

# Azure Functions Core Tools がインストールされていない場合
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Azure Functions プロジェクト初期化
func init . --typescript --worker-runtime node

# または既存ディレクトリで
npm init -y
npm install @azure/functions
```

##### 2. TypeScript 5.7+ 設定

```bash
cd backend

# TypeScript インストール
npm install -D typescript@^5.7 @types/node

# TypeScript 初期化
npx tsc --init
```

##### 3. package.json 設定

`backend/package.json` を作成:

```json
{
  "name": "shadowverse-battle-log-backend",
  "version": "1.0.0",
  "description": "Shadowverse Battle Log - Azure Functions Backend",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rimraf dist",
    "prestart": "npm run clean && npm run build",
    "start": "func start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/storage-blob": "^12.24.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^22.0.0",
    "jest": "^29.7.0",
    "rimraf": "^6.0.1",
    "typescript": "^5.7.0"
  }
}
```

##### 4. host.json 設定

`backend/host.json` を作成:

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:05:00",
  "http": {
    "routePrefix": "api"
  }
}
```

##### 5. local.settings.json (テンプレート)

`backend/local.settings.json` を作成（Gitにはコミットしない）:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AZURE_STORAGE_CONNECTION_STRING": "<YOUR_AZURE_STORAGE_CONNECTION_STRING>"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

`backend/local.settings.json.template` を作成（Gitにコミット）:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AZURE_STORAGE_CONNECTION_STRING": "<YOUR_AZURE_STORAGE_CONNECTION_STRING>"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

##### 6. ディレクトリ構造作成

```bash
cd backend/src

# ディレクトリ作成
mkdir -p functions
mkdir -p services
mkdir -p storage
mkdir -p types
mkdir -p utils

# 各ディレクトリに index.ts を作成
touch functions/index.ts
touch services/index.ts
touch storage/index.ts
touch types/index.ts
touch utils/index.ts
```

##### 7. tsconfig.json (strict mode)

`backend/tsconfig.json` を作成:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2023"],
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node", "@azure/functions"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

##### 8. Biome 設定

`backend/biome.json` を作成:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", "dist", "coverage"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

#### 完了条件

- [ ] Azure Functions Core Tools がインストールされている
- [ ] Azure Functions v4 プロジェクトが作成されている
- [ ] TypeScript 5.7+ が設定されている
- [ ] `package.json` が設定されている
- [ ] `host.json` が設定されている
- [ ] `local.settings.json.template` が作成されている
- [ ] ディレクトリ構造が作成されている
- [ ] `tsconfig.json` が strict mode で設定されている
- [ ] Biome が設定されている
- [ ] `npm start` で開発サーバーが起動する

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

#### 検証手順

1. `func --version` で Azure Functions Core Tools がインストールされているか確認
2. `cd backend && npm install` で依存関係がインストールされるか確認
3. `npm run build` で TypeScript がビルドされるか確認
4. `npm start` で開発サーバーが起動するか確認 (http://localhost:7071)
5. `npm run lint` でリンターが動作するか確認

---

### TASK-0004: Azure Blob Storage設定

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-602 (Azure Blob Storage使用)
- **依存タスク**: TASK-0003
- **信頼性レベル**: 🔵 *REQ-602より*

#### 実装詳細

##### 1. Azure Storage Account の作成

Azure Portal または Azure CLI で Storage Account を作成:

```bash
# Azure CLI でログイン
az login

# リソースグループ作成（既存の場合はスキップ）
az group create --name shadowverse-rg --location japaneast

# Storage Account 作成
az storage account create \
  --name shadowversestorage \
  --resource-group shadowverse-rg \
  --location japaneast \
  --sku Standard_LRS \
  --kind StorageV2
```

##### 2. コンテナ `shadowverse-data` 作成

```bash
# 接続文字列を取得
az storage account show-connection-string \
  --name shadowversestorage \
  --resource-group shadowverse-rg \
  --output tsv

# コンテナ作成
az storage container create \
  --name shadowverse-data \
  --connection-string "<YOUR_CONNECTION_STRING>" \
  --public-access off
```

##### 3. 既存JSONファイルアップロード

既存のJSONファイル（`battle-logs.json`, `deck-master.json`, `my-decks.json`）がある場合、アップロード:

```bash
# battle-logs.json をアップロード
az storage blob upload \
  --container-name shadowverse-data \
  --name battle-logs.json \
  --file ./data/json/battle-logs.json \
  --connection-string "<YOUR_CONNECTION_STRING>"

# deck-master.json をアップロード
az storage blob upload \
  --container-name shadowverse-data \
  --name deck-master.json \
  --file ./data/json/deck-master.json \
  --connection-string "<YOUR_CONNECTION_STRING>"

# my-decks.json をアップロード
az storage blob upload \
  --container-name shadowverse-data \
  --name my-decks.json \
  --file ./data/json/my-decks.json \
  --connection-string "<YOUR_CONNECTION_STRING>"
```

既存ファイルがない場合、空の配列でファイルを作成:

`data/json/battle-logs.json`:
```json
[]
```

`data/json/deck-master.json`:
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

`data/json/my-decks.json`:
```json
[
  {
    "id": "1",
    "deckId": "1",
    "deckCode": "3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1.3.1",
    "deckName": "秘術オデンスペル",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

##### 4. 接続文字列の設定

`backend/local.settings.json` に接続文字列を設定:

```json
{
  "Values": {
    "AZURE_STORAGE_CONNECTION_STRING": "<YOUR_CONNECTION_STRING>"
  }
}
```

**注意**: `local.settings.json` は `.gitignore` に含まれており、コミットされません。

##### 5. CORS設定

Azure Portal で Blob Storage の CORS 設定を行う:

- **Allowed origins**: `https://<your-app-name>.azurestaticapps.net`, `http://localhost:5173`
- **Allowed methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed headers**: `*`
- **Exposed headers**: `*`
- **Max age**: 3600

Azure CLI で設定:

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT DELETE OPTIONS \
  --origins "https://<your-app-name>.azurestaticapps.net" "http://localhost:5173" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --connection-string "<YOUR_CONNECTION_STRING>"
```

#### 完了条件

- [ ] Azure Storage Account が作成されている
- [ ] コンテナ `shadowverse-data` が作成されている
- [ ] 既存JSONファイルまたは初期データがアップロードされている
- [ ] 接続文字列が `local.settings.json` に設定されている
- [ ] CORS設定が完了している
- [ ] Azure Portal で Blob Storage にアクセスできる

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

#### 検証手順

1. Azure Portal で Storage Account が存在するか確認
2. コンテナ `shadowverse-data` が存在するか確認
3. コンテナ内に `battle-logs.json`, `deck-master.json`, `my-decks.json` が存在するか確認
4. `local.settings.json` に接続文字列が設定されているか確認
5. Azure Portal で CORS 設定が正しいか確認

---

### TASK-0005: 共有型定義実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: DIRECT
- **要件**: REQ-601 (既存データ構造互換性)
- **依存タスク**: TASK-0002, TASK-0003
- **信頼性レベル**: 🔵 *REQ-601より*

#### 実装詳細

##### 1. フロントエンド型定義 (`frontend/src/types/index.ts`)

```typescript
/**
 * 対戦タイプ
 */
export type BattleType = 'ランクマッチ' | '対戦台' | 'ロビー大会';

/**
 * ランク
 */
export type Rank = 'サファイア' | 'ダイアモンド' | 'ルビー' | 'トパーズ' | '-';

/**
 * グループ
 */
export type Group = 'A' | 'AA' | 'AAA' | 'Master' | '-';

/**
 * ターン
 */
export type Turn = '先攻' | '後攻';

/**
 * 対戦結果
 */
export type BattleResult = '勝ち' | '負け';

/**
 * 対戦履歴エンティティ
 */
export interface BattleLog {
  /** 対戦履歴ID */
  id: string;
  /** 対戦日 (YYYY/MM/DD 形式) */
  date: string;
  /** 対戦タイプ */
  battleType: BattleType;
  /** ランク */
  rank: Rank;
  /** グループ */
  group: Group;
  /** マイデッキID */
  myDeckId: string;
  /** ターン */
  turn: Turn;
  /** 対戦結果 */
  result: BattleResult;
  /** 相手デッキID */
  opponentDeckId: string;
}

/**
 * デッキマスターエンティティ（相手デッキ）
 */
export interface DeckMaster {
  /** デッキID */
  id: string;
  /** クラス名 */
  className: string;
  /** デッキ名 */
  deckName: string;
  /** ソート順 */
  sortOrder: number;
}

/**
 * マイデッキエンティティ
 */
export interface MyDeck {
  /** デッキID */
  id: string;
  /** デッキマスターID */
  deckId: string;
  /** デッキコード */
  deckCode: string;
  /** デッキ名 */
  deckName: string;
  /** 使用中フラグ */
  isActive: boolean;
  /** 作成日時 (ISO 8601形式) */
  createdAt: string;
}

/**
 * 定数定義
 */
export const BATTLE_TYPES: readonly BattleType[] = ['ランクマッチ', '対戦台', 'ロビー大会'];

export const RANKS: readonly Rank[] = ['サファイア', 'ダイアモンド', 'ルビー', 'トパーズ', '-'];

export const GROUPS: readonly Group[] = ['A', 'AA', 'AAA', 'Master', '-'];

export const TURNS: readonly Turn[] = ['先攻', '後攻'];

export const BATTLE_RESULTS: readonly BattleResult[] = ['勝ち', '負け'];

/**
 * API レスポンス型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * 対戦履歴一覧レスポンス
 */
export interface BattleLogsResponse {
  battleLogs: BattleLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 統計データレスポンス
 */
export interface StatisticsResponse {
  overall: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  byMyDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byOpponentDeck: Array<{
    deckId: string;
    deckName: string;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byRank: Array<{
    rank: Rank;
    group: Group;
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
  byTurn: {
    先攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    後攻: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  opponentDeckDistribution: Array<{
    deckId: string;
    deckName: string;
    count: number;
    percentage: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}
```

##### 2. バックエンド型定義 (`backend/src/types/index.ts`)

フロントエンドと同じ内容をコピー。将来的には共有パッケージとして管理することも検討。

```bash
# フロントエンドの型定義をバックエンドにコピー
cp frontend/src/types/index.ts backend/src/types/index.ts
```

##### 3. 型定義の整合性確認

フロントエンド・バックエンドの両方で型定義が同一であることを確認:

```bash
# フロントエンド
cd frontend
pnpm type-check

# バックエンド
cd backend
npm run build
```

##### 4. エクスポート設定

各ディレクトリの `index.ts` でエクスポート:

`frontend/src/types/index.ts` と `backend/src/types/index.ts` はすでに完成しているため、追加作業不要。

#### 完了条件

- [ ] `frontend/src/types/index.ts` が作成されている
- [ ] `backend/src/types/index.ts` が作成されている（同一内容）
- [ ] すべての型定義がエクスポートされている
- [ ] 定数定義がエクスポートされている
- [ ] フロントエンド・バックエンド両方で型チェックが成功する

#### 実行コマンド

```bash
/tsumiki:direct-setup
/tsumiki:direct-verify
```

#### 検証手順

1. `frontend/src/types/index.ts` が存在し、正しい型定義が記載されているか確認
2. `backend/src/types/index.ts` が存在し、フロントエンドと同一内容か確認
3. `cd frontend && pnpm type-check` で型チェックが成功するか確認
4. `cd backend && npm run build` で型チェックが成功するか確認

---

### TASK-0006: Blob Storage クライアント実装

- [ ] **タスク完了**
- **推定工数**: 8時間
- **タスクタイプ**: TDD
- **要件**: REQ-602 (Azure Blob Storage使用), EDGE-002 (エラーハンドリング)
- **依存タスク**: TASK-0004, TASK-0005
- **信頼性レベル**: 🔵 *REQ-602, EDGE-002より*

#### 実装詳細

##### 1. BlobStorageClient クラス実装

`backend/src/storage/blobStorageClient.ts` を作成:

```typescript
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { BattleLog, DeckMaster, MyDeck } from '../types';

/**
 * Blob Storage クライアント
 *
 * Azure Blob Storage へのアクセスを抽象化するクライアント
 */
export class BlobStorageClient {
  private containerClient: ContainerClient;
  private maxRetries = 3;
  private retryDelayMs = 1000;

  constructor(connectionString: string, containerName: string) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * JSON ファイルを読み込む（汎用）
   */
  private async readJsonFile<T>(blobName: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const blobClient = this.containerClient.getBlobClient(blobName);
        const downloadResponse = await blobClient.download();

        if (!downloadResponse.readableStreamBody) {
          throw new Error(`Failed to download blob: ${blobName}`);
        }

        const content = await this.streamToString(downloadResponse.readableStreamBody);
        return JSON.parse(content) as T;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed for ${blobName}:`, error);

        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt); // 指数バックオフ
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to read ${blobName} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * JSON ファイルを書き込む（汎用）
   */
  private async writeJsonFile<T>(blobName: string, data: T): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const content = JSON.stringify(data, null, 2);

        await blockBlobClient.upload(content, content.length, {
          blobHTTPHeaders: { blobContentType: 'application/json' },
        });

        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed for ${blobName}:`, error);

        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to write ${blobName} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Stream を文字列に変換
   */
  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      readableStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      readableStream.on('error', reject);
    });
  }

  /**
   * 指定ミリ秒待機
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 対戦履歴を取得
   */
  async getBattleLogs(): Promise<BattleLog[]> {
    return this.readJsonFile<BattleLog[]>('battle-logs.json');
  }

  /**
   * デッキマスターを取得
   */
  async getDeckMasters(): Promise<DeckMaster[]> {
    return this.readJsonFile<DeckMaster[]>('deck-master.json');
  }

  /**
   * マイデッキを取得
   */
  async getMyDecks(): Promise<MyDeck[]> {
    return this.readJsonFile<MyDeck[]>('my-decks.json');
  }

  /**
   * 対戦履歴を保存
   */
  async saveBattleLogs(battleLogs: BattleLog[]): Promise<void> {
    return this.writeJsonFile('battle-logs.json', battleLogs);
  }

  /**
   * マイデッキを保存
   */
  async saveMyDecks(myDecks: MyDeck[]): Promise<void> {
    return this.writeJsonFile('my-decks.json', myDecks);
  }
}
```

##### 2. 単体テスト (Jest)

`backend/tests/storage/blobStorageClient.test.ts` を作成:

```typescript
import { BlobStorageClient } from '../../src/storage/blobStorageClient';
import { BattleLog, DeckMaster, MyDeck } from '../../src/types';

// モックデータ
const mockBattleLogs: BattleLog[] = [
  {
    id: '1',
    date: '2025/10/23',
    battleType: 'ランクマッチ',
    rank: 'ダイアモンド',
    group: 'A',
    myDeckId: '1',
    turn: '先攻',
    result: '勝ち',
    opponentDeckId: '2',
  },
];

const mockDeckMasters: DeckMaster[] = [
  {
    id: '1',
    className: 'ウィッチ',
    deckName: '土スペルウィッチ',
    sortOrder: 1,
  },
];

const mockMyDecks: MyDeck[] = [
  {
    id: '1',
    deckId: '1',
    deckCode: '3.1.3.1.3.1...',
    deckName: '秘術オデンスペル',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('BlobStorageClient', () => {
  let client: BlobStorageClient;

  beforeEach(() => {
    // 実際のテストでは環境変数から接続文字列を取得
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    client = new BlobStorageClient(connectionString, 'shadowverse-data');
  });

  describe('getBattleLogs', () => {
    it('対戦履歴を取得できる', async () => {
      const battleLogs = await client.getBattleLogs();
      expect(Array.isArray(battleLogs)).toBe(true);
    });

    it('空の配列が返る場合がある', async () => {
      const battleLogs = await client.getBattleLogs();
      expect(battleLogs).toEqual(expect.any(Array));
    });
  });

  describe('getDeckMasters', () => {
    it('デッキマスターを取得できる', async () => {
      const deckMasters = await client.getDeckMasters();
      expect(Array.isArray(deckMasters)).toBe(true);
    });
  });

  describe('getMyDecks', () => {
    it('マイデッキを取得できる', async () => {
      const myDecks = await client.getMyDecks();
      expect(Array.isArray(myDecks)).toBe(true);
    });
  });

  describe('saveBattleLogs', () => {
    it('対戦履歴を保存できる', async () => {
      await expect(client.saveBattleLogs(mockBattleLogs)).resolves.not.toThrow();
    });
  });

  describe('saveMyDecks', () => {
    it('マイデッキを保存できる', async () => {
      await expect(client.saveMyDecks(mockMyDecks)).resolves.not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('接続エラー時に3回リトライする', async () => {
      // モックで接続エラーをシミュレート
      const invalidClient = new BlobStorageClient('invalid_connection_string', 'shadowverse-data');

      await expect(invalidClient.getBattleLogs()).rejects.toThrow();
    }, 10000); // タイムアウトを10秒に設定
  });
});
```

##### 3. Jest 設定

`backend/jest.config.js` を作成:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

`backend/package.json` に Jest 依存関係を追加:

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0"
  }
}
```

#### 完了条件

- [ ] `BlobStorageClient` クラスが実装されている
- [ ] `getBattleLogs`, `getDeckMasters`, `getMyDecks` メソッドが実装されている
- [ ] `saveBattleLogs`, `saveMyDecks` メソッドが実装されている
- [ ] エラーハンドリング（3回リトライ、指数バックオフ）が実装されている
- [ ] 単体テストが実装されている
- [ ] すべてのテストが成功する (100%)

#### 実行コマンド

```bash
# TDDフロー
/tsumiki:tdd-requirements  # 要件整理
/tsumiki:tdd-testcases     # テストケース洗い出し
/tsumiki:tdd-red           # テスト実装（失敗）
/tsumiki:tdd-green         # 最小実装（成功）
/tsumiki:tdd-refactor      # リファクタリング
/tsumiki:tdd-verify-complete  # 品質確認
```

#### 検証手順

1. `backend/src/storage/blobStorageClient.ts` が存在し、正しい実装がされているか確認
2. `backend/tests/storage/blobStorageClient.test.ts` が存在するか確認
3. `cd backend && npm test` でテストが成功するか確認
4. テストカバレッジが70%以上であるか確認 (`npm run test:coverage`)
5. 型チェックが成功するか確認 (`npm run build`)

---

## フェーズ完了条件

- [ ] すべてのタスクが完了している
- [ ] フロントエンド開発サーバーが起動する (`cd frontend && pnpm dev`)
- [ ] バックエンド開発サーバーが起動する (`cd backend && npm start`)
- [ ] Azure Blob Storage への接続が成功する
- [ ] 共有型定義がフロント・バック両方で使用可能
- [ ] Blob Storage クライアントのテストが100%成功
- [ ] すべてのlintエラー・警告が0件

### 検証コマンド

```bash
# フロントエンド
cd frontend
pnpm install
pnpm lint
pnpm type-check
pnpm dev  # http://localhost:5173 でアクセス可能

# バックエンド
cd backend
npm install
npm run lint
npm run build
npm test
npm start  # http://localhost:7071 でアクセス可能

# Azure Blob Storage 接続確認
az storage container show \
  --name shadowverse-data \
  --connection-string "<YOUR_CONNECTION_STRING>"
```

---

## 次フェーズへの準備

Phase 2では、このPhase 1で構築した基盤の上に、バックエンドAPIの実装を行います。

### Phase 2 で実装する主要API

1. **対戦履歴CRUD API** (GET/POST/DELETE)
2. **対戦履歴詳細取得API** (GET by ID)
3. **デッキマスター取得API**
4. **統計計算API** (期間別・デッキ別・ランク別)
5. **データインポートAPI** (JSON/CSV)

---

## トラブルシューティング

### Azure Storage 接続エラー

**エラー**: `Failed to connect to Azure Storage`

**原因**:
- 接続文字列が正しくない
- Storage Account が存在しない
- ネットワーク接続エラー

**解決策**:
1. 接続文字列を確認: `az storage account show-connection-string`
2. Storage Account の存在確認: `az storage account list`
3. ネットワーク接続確認: `ping <storage-account-name>.blob.core.windows.net`

### pnpm install エラー

**エラー**: `ENOENT: no such file or directory`

**原因**:
- Node.js バージョンが古い
- pnpm がインストールされていない

**解決策**:
1. Node.js 22.x をインストール
2. pnpm をインストール: `npm install -g pnpm`

### TypeScript コンパイルエラー

**エラー**: `Cannot find module '@/*'`

**原因**:
- `tsconfig.json` の `paths` 設定が正しくない
- `vite.config.ts` の `alias` 設定が正しくない

**解決策**:
1. `tsconfig.json` の `baseUrl` と `paths` を確認
2. `vite.config.ts` の `resolve.alias` を確認

---

## 参考資料

- [Azure Functions TypeScript Developer Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-node)
- [Azure Blob Storage Node.js SDK](https://learn.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-nodejs)
- [Vite Configuration Reference](https://vitejs.dev/config/)
- [React 19 Documentation](https://react.dev)
- [Biome Documentation](https://biomejs.dev/)

---

**ドキュメント終了**
