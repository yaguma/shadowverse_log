# Scripts Directory

このディレクトリには、Shadowverse Battle Log アプリケーションのセットアップや運用に使用するスクリプトを格納しています。

## スクリプト一覧

### setup-azure-storage.sh

Azure Blob Storage の自動セットアップスクリプトです。

**機能:**
- Azure リソースグループの作成
- ストレージアカウントの作成
- Blob コンテナの作成
- CORS の設定
- Soft Delete の有効化
- 初期データのアップロード
- local.settings.json の自動更新

**使用方法:**

```bash
# スクリプトを実行可能にする
chmod +x scripts/setup-azure-storage.sh

# スクリプトを実行
./scripts/setup-azure-storage.sh
```

**前提条件:**
- Azure CLI がインストールされていること
- Azure にログイン済みであること (`az login`)
- 適切な権限があること (Contributor 以上)

**詳細なドキュメント:**
- [Azure Storage セットアップガイド](../docs/azure-storage-setup.md)

## 今後追加予定のスクリプト

- `backup-azure-storage.sh` - Azure Blob Storage のバックアップスクリプト
- `migrate-phase1-to-phase2.sh` - Phase 1 から Phase 2 へのデータマイグレーション
- `deploy-azure-functions.sh` - Azure Functions のデプロイスクリプト
- `setup-development.sh` - ローカル開発環境の一括セットアップ

## 注意事項

- スクリプトを実行する前に、必ず内容を確認してください
- 本番環境で実行する前に、テスト環境で動作確認を行ってください
- 実行前にバックアップを取ることを推奨します
- スクリプトは冪等性を考慮して設計されていますが、既存リソースがある場合は注意してください

## トラブルシューティング

### 権限エラーが発生する場合

```bash
# サブスクリプションの権限を確認
az role assignment list --assignee <your-email> --output table

# 必要に応じて権限を付与してもらう
```

### スクリプトが実行できない場合

```bash
# 実行権限を確認
ls -la scripts/

# 実行権限を付与
chmod +x scripts/*.sh
```

## 関連ドキュメント

- [Azure Storage セットアップガイド](../docs/azure-storage-setup.md)
- [Blob Storage 設計文書](../docs/design/shadowverse-battle-log/blob-storage-design.md)
- [技術スタック](../docs/tech-stack.md)
