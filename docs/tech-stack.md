# プロジェクト技術スタック定義

## 🔧 生成情報
- **生成日**: 2025-10-22
- **生成ツール**: tsumiki:init-tech-stack
- **プロジェクトタイプ**: Webアプリケーション
- **チーム規模**: 個人開発
- **開発期間**: プロトタイプ/MVP (1-2ヶ月)

## 🎯 プロジェクト要件サマリー
- **既存連携**: 新規構築
- **パフォーマンス**: 軽負荷（同時利用者数10人以下、レスポンス時間3秒以内）
- **セキュリティ**: 基本的なWebセキュリティ対策
- **技術スキル**: Python, JavaScript/TypeScript, データベース設計経験豊富
- **学習コスト許容度**: 積極的に新技術を導入したい
- **デプロイ先**: クラウド (AWS/Azure/GCP)
- **予算**: コスト最小化（無料・低コストツール優先）

## 🚀 フロントエンド
- **フレームワーク**: React 19.x
- **ビルドツール**: Vite 6.x
- **言語**: TypeScript 5.7+
- **状態管理**: Zustand / Jotai (軽量状態管理)
- **スタイリング**: Tailwind CSS v4
- **ルーティング**: React Router v7 / TanStack Router

### 選択理由
- Viteの超高速HMRでMVP開発を加速
- React 19の最新機能 (Server Components, Actions) を活用
- TypeScriptで型安全性を確保しつつ開発速度を維持
- Tailwind CSS v4で最新のCSS機能活用

## ⚙️ バックエンド
- **フレームワーク**: FastAPI 0.115+
- **言語**: Python 3.12+
- **ASGI サーバー**: Uvicorn
- **ORM**: SQLAlchemy 2.0 (非同期対応)
- **バリデーション**: Pydantic v2
- **認証**: JWT (python-jose) または Supabase Auth

### 選択理由
- Python経験を最大活用、MVP開発に最適
- FastAPIの自動APIドキュメント生成 (OpenAPI/Swagger)
- Pydantic v2で型安全なバリデーション
- 非同期処理対応で将来のスケーリングに備える

## 💾 データベース設計
- **開発環境**: SQLite 3
- **本番環境**: PostgreSQL 16+
- **キャッシュ**: Redis 7+ (必要に応じて後から追加)
- **ファイルストレージ**: Cloudflare R2 (S3互換、無料枠10GB) / ローカル (開発)

### 設計方針
- MVP段階: SQLiteでセットアップ不要、高速開発
- 本番移行: PostgreSQLに切り替え（SQLAlchemyでスムーズ移行）
- ACID準拠のトランザクション
- 適切なインデックス戦略でクエリ最適化

## 🛠️ 開発環境
- **Python環境管理**: uv (超高速パッケージマネージャー)
- **Node.js**: 22.x LTS
- **パッケージマネージャー**: pnpm 9.x (高速、ディスク効率)
- **コンテナ**: Docker + Docker Compose (本番環境一貫性)

### 開発ツール
- **Python Linter/Formatter**: Ruff (超高速、Flake8/Black/isort統合)
- **JS/TS Linter/Formatter**: Biome (ESLint + Prettier統合、超高速)
- **型チェック**: TypeScript (strict mode), mypy (Python)
- **テストフレームワーク**:
  - フロントエンド: Vitest + React Testing Library
  - バックエンド: pytest + pytest-asyncio
  - E2E: Playwright

### CI/CD
- **CI/CD**: GitHub Actions (月2000分無料枠)
- **コード品質**: Ruff, Biome, TypeScript, mypy
- **テスト**: Unit, Integration, E2E (Playwright)
- **自動デプロイ**: main ブランチマージ時

## ☁️ インフラ・デプロイ (コスト最小化構成)

### フロントエンド
- **ホスティング**: Cloudflare Pages (完全無料)
  - 無制限リクエスト
  - 自動HTTPS、グローバルCDN
  - ビルド: 月500回まで無料

### バックエンド
- **主推奨**: AWS Lambda + API Gateway (無料枠)
  - Lambda: 月100万リクエスト無料
  - API Gateway: 月100万リクエスト無料
  - Cold start対策: Provisioned Concurrency (有料時検討)

- **代替案**: Fly.io (無料枠)
  - コンテナベースデプロイ
  - PostgreSQL無料枠込み
  - 制限: 3台までの小規模VM

### データベース
- **Supabase (無料枠)**
  - PostgreSQL 500MB無料
  - 自動バックアップ
  - 管理UI付き
  - Row Level Security (RLS) 対応

### 認証
- **Supabase Auth (無料)**
  - JWT標準対応
  - メール認証、パスワードリセット
  - OAuth対応 (Google, GitHub等)

### ファイルストレージ
- **Cloudflare R2 (無料枠10GB)**
  - S3互換API
  - 無料枠: 10GB/月、1000万リクエスト/月
  - Egress料金なし

## 🔒 セキュリティ
- **HTTPS**: 必須 (Cloudflare自動証明書)
- **認証**: JWT + Refresh Token / Supabase Auth
- **CORS**: 適切なオリジン制限設定
- **バリデーション**: Pydantic (バックエンド)、Zod (フロントエンド)
- **環境変数**: .env.local (開発), Secrets Manager (本番)
- **依存関係**:
  - Dependabot自動PR
  - `uv pip check` (Python)
  - `pnpm audit` (Node.js)
- **SQL Injection対策**: SQLAlchemy ORM使用
- **XSS対策**: React自動エスケープ + Content Security Policy

## 📊 品質基準
- **テストカバレッジ**: 70%以上 (MVP段階)
- **コード品質**: Ruff + Biome自動チェック
- **型安全性**: TypeScript strict mode, mypy strict mode
- **パフォーマンス**:
  - Lighthouse 85+点 (MVP目標)
  - Core Web Vitals合格
- **アクセシビリティ**: WCAG 2.1 AA準拠を目指す

## 📁 推奨ディレクトリ構造

```
shadowverse_log/
├── frontend/                 # React アプリケーション
│   ├── src/
│   │   ├── components/       # 再利用可能コンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   ├── store/            # 状態管理 (Zustand/Jotai)
│   │   ├── types/            # 型定義
│   │   ├── api/              # API クライアント
│   │   └── utils/            # ユーティリティ
│   ├── public/               # 静的ファイル
│   ├── tests/                # E2E テスト (Playwright)
│   ├── package.json
│   ├── vite.config.ts
│   └── biome.json
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── main.py           # FastAPI アプリケーション
│   │   ├── api/              # API エンドポイント
│   │   ├── models/           # SQLAlchemy モデル
│   │   ├── schemas/          # Pydantic スキーマ
│   │   ├── services/         # ビジネスロジック
│   │   ├── db/               # DB接続、マイグレーション
│   │   └── core/             # 設定、セキュリティ
│   ├── tests/                # pytest テスト
│   ├── pyproject.toml        # uv設定
│   ├── ruff.toml
│   └── Dockerfile
├── docs/                     # プロジェクトドキュメント
│   └── tech-stack.md         # このファイル
├── .github/
│   └── workflows/            # GitHub Actions
├── docker-compose.yml        # 開発環境
└── README.md                 # プロジェクト概要
```

## 🚀 セットアップ手順

### 1. 開発環境準備

#### Python環境 (uv使用)
```bash
# uv インストール (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Python 3.12 + プロジェクトセットアップ
cd backend
uv venv --python 3.12
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"

# 開発サーバー起動
uv run uvicorn app.main:app --reload
```

#### Node.js環境 (pnpm使用)
```bash
# pnpm インストール
npm install -g pnpm

# フロントエンドセットアップ
cd frontend
pnpm install
pnpm dev
```

#### Docker環境
```bash
# ルートディレクトリで
docker-compose up -d
```

### 2. 主要コマンド

#### フロントエンド
```bash
pnpm dev          # 開発サーバー起動 (http://localhost:5173)
pnpm build        # 本番ビルド
pnpm preview      # ビルド確認
pnpm test         # Vitest テスト実行
pnpm test:e2e     # Playwright E2Eテスト
pnpm lint         # Biome lint
pnpm format       # Biome format
pnpm type-check   # TypeScript型チェック
```

#### バックエンド
```bash
uv run uvicorn app.main:app --reload  # 開発サーバー (http://localhost:8000)
uv run pytest                         # テスト実行
uv run pytest --cov                   # カバレッジ付きテスト
uv run ruff check .                   # Lint
uv run ruff format .                  # Format
uv run mypy .                         # 型チェック
```

#### データベース
```bash
# Alembic マイグレーション
uv run alembic revision --autogenerate -m "migration message"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### 3. API ドキュメント
FastAPI自動生成ドキュメント:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📝 技術スタック更新方針

このファイルはプロジェクトの進行に応じて更新してください:

### MVP段階 (現在)
- シンプルな構成維持
- 無料枠内での運用
- 開発速度最優先

### トラフィック増加時
- Redis導入 (キャッシュ、セッション)
- CDN最適化
- Database接続プーリング
- Monitoring追加 (Sentry, LogRocket)

### 本番スケール時
- PostgreSQL専用インスタンス
- Load Balancer導入
- Auto Scaling設定
- Backup戦略強化

## 🔄 更新履歴
- 2025-10-22: 初回生成 (tsumiki:init-tech-stack により自動生成)
  - MVP段階の技術スタック定義
  - コスト最小化構成
  - 最新技術採用 (React 19, FastAPI, Vite 6, uv, Biome)
