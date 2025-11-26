# Phase 3 Part 1-i: Vite + React 19 セットアップ

## フェーズ概要

- **期間**: Day 11-15 (5営業日)
- **総工数**: 40時間
- **目標**: Cloudflare Workers APIに対応したReact フロントエンドの実装完了
- **前提条件**: Phase 2完了 (Cloudflare Workers API、D1 Database実装済み)
- **成果物**:
  - Vite + React 19プロジェクト
  - Cloudflare Workers APIへの接続
  - 対戦履歴登録・一覧表示
  - 統計ダッシュボード
  - レスポンシブUI (PC/モバイル)
  - E2Eテスト

## 週次計画

### Week 3 (Day 11-13)

- **目標**: React基盤、状態管理、API接続、対戦履歴UI実装
- **成果物**: 対戦履歴登録・一覧機能が動作

### Week 3 後半 (Day 14-15)

- **目標**: 統計ダッシュボード、レスポンシブ対応、E2Eテスト
- **成果物**: すべてのフロントエンド機能が完成

## Part 1-i タスク一覧

このPart 1-iでは、React基盤のセットアップを行います。

- **TASK-0033**: Vite + React 19 セットアップ

---

### TASK-0033: Vite + React 19 セットアップ

- [ ] **タスク未着手**
- **推定工数**: 6時間
- **タスクタイプ**: DIRECT
- **要件**: architecture-cloudflare.md (フロントエンド構成), tech-stack.md (React 19.x, Vite 6.x, TypeScript 5.7+) 🔵
- **依存タスク**: TASK-0027 (Cloudflare Workers APIセットアップ), TASK-0032 (Import/Export API実装)
- **要件名**: Cloudflare環境向けフロントエンドセットアップ

#### 実装詳細

1. **Vite 6.x プロジェクト初期化**
   - ディレクトリ: `frontend/`

   ```bash
   cd frontend
   pnpm create vite@latest . --template react-ts
   pnpm install
   ```

2. **React 19.x セットアップ**
   - `package.json`の依存関係更新

   ```json
   {
     "dependencies": {
       "react": "^19.0.0",
       "react-dom": "^19.0.0",
       "react-router-dom": "^7.0.0",
       "zustand": "^5.0.2"
     },
     "devDependencies": {
       "@types/react": "^19.0.0",
       "@types/react-dom": "^19.0.0",
       "@vitejs/plugin-react": "^4.3.4",
       "vite": "^6.0.0",
       "typescript": "^5.7.0"
     }
   }
   ```

3. **TypeScript strict mode 設定**
   - ファイル: `frontend/tsconfig.json`

   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "lib": ["ES2023", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "isolatedModules": true,
       "moduleDetection": "force",
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "noUncheckedSideEffectImports": true
     },
     "include": ["src"]
   }
   ```

4. **Tailwind CSS v4 設定**
   - インストール:

   ```bash
   pnpm add -D tailwindcss@next postcss autoprefixer
   pnpm dlx tailwindcss init -p
   ```

   - `frontend/tailwind.config.ts`:

   ```typescript
   import type { Config } from 'tailwindcss';

   export default {
     content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
     theme: {
       extend: {},
     },
     plugins: [],
   } satisfies Config;
   ```

   - `frontend/src/index.css`:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. **Biome設定**
   - ファイル: `frontend/biome.json`

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
       "ignore": ["node_modules", "dist", ".vite"]
     },
     "formatter": {
       "enabled": true,
       "indentStyle": "space",
       "indentWidth": 2,
       "lineWidth": 100
     },
     "organizeImports": {
       "enabled": true
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
         "semicolons": "always"
       }
     }
   }
   ```

   - `package.json`スクリプト追加:

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

6. **環境変数設定**
   - ファイル: `frontend/.env.local`

   ```
   VITE_API_BASE_URL=http://localhost:8787/api
   ```

   - ファイル: `frontend/.env.production`

   ```
   VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev/api
   ```

7. **ディレクトリ構成作成**

   ```bash
   mkdir -p frontend/src/{components/{common,battle-log,statistics,layout},pages,hooks,store,types,api,utils}
   ```

#### 完了条件

- [ ] Vite 6.xプロジェクトが初期化されている
- [ ] React 19.xがインストールされている
- [ ] TypeScript 5.7+ strict modeが設定されている
- [ ] Tailwind CSS v4が設定されている
- [ ] Biomeが設定されている
- [ ] 環境変数ファイルが作成されている
- [ ] ディレクトリ構成が作成されている
- [ ] `pnpm dev`で開発サーバーが起動する
- [ ] `pnpm lint`でエラーが0件
- [ ] `pnpm type-check`でエラーが0件

#### 検証手順

1. プロジェクト初期化確認
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

2. ブラウザで http://localhost:5173 を開く

3. Lint・型チェック
   ```bash
   pnpm lint
   pnpm type-check
   ```

#### 実行コマンド

```bash
/tsumiki:direct-setup TASK-0033
/tsumiki:direct-verify TASK-0033
```

---

## 更新履歴

- **2025-11-26**: Phase 3 Part 1-i作成
  - Vite + React 19 セットアップ

---

**ドキュメント終了**
