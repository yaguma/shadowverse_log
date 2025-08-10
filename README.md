# シャドウバース対戦履歴管理アプリケーション

## 概要

シャドバの対戦履歴を登録、一覧ができるWebApplication

## プロジェクト構成

```
shadowverse_log/
├── backend/          # Node.js + TypeScript バックエンド
├── frontend/         # Vue.js 3 + TypeScript フロントエンド
├── data/
│   ├── json/         # JSONファイルストレージ
│   └── csv/          # CSVファイルストレージ
└── README.md
```

## 開発環境のセットアップ

### バックエンド
```bash
cd backend
npm install
npm run dev
```

### フロントエンド
```bash
cd frontend
npm install
npm run dev
```

## 機能

- 対戦履歴登録（ダイアログ）
- 対戦履歴一覧表示（直近1週間の100件）

## 技術スタック

- **バックエンド**: Node.js, TypeScript, Express
- **フロントエンド**: Vue.js 3, TypeScript, Vite
- **データストレージ**: JSON/CSVファイル（BlobStorage想定）