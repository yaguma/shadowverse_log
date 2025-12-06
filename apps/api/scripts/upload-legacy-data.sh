#!/bin/bash

# TASK-0025-4: 既存JSONデータをR2にアップロード
# Usage: ./scripts/upload-legacy-data.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/../data/json"
R2_BUCKET="shadowverse-data"

echo "=== Legacy Data Upload to R2 ==="
echo "Project root: $PROJECT_ROOT"
echo "Data directory: $DATA_DIR"
echo "R2 Bucket: $R2_BUCKET"
echo ""

# データディレクトリの確認
if [ ! -d "$DATA_DIR" ]; then
    echo "Error: Data directory not found: $DATA_DIR"
    exit 1
fi

# JSONファイルの一覧を表示
echo "=== Source Files ==="
ls -la "$DATA_DIR"/*.json 2>/dev/null || echo "No JSON files found"
echo ""

# ファイルサイズの確認
echo "=== File Sizes ==="
du -sh "$DATA_DIR"/*.json 2>/dev/null || echo "No JSON files found"
echo ""

# R2にアップロード
echo "=== Uploading to R2 ==="

# deck-master.json
if [ -f "$DATA_DIR/deck-master.json" ]; then
    echo "Uploading deck-master.json..."
    wrangler r2 object put "$R2_BUCKET/legacy/deck-master.json" --file="$DATA_DIR/deck-master.json"
    echo "✓ deck-master.json uploaded"
else
    echo "⚠ deck-master.json not found, skipping"
fi

# battle-logs.json
if [ -f "$DATA_DIR/battle-logs.json" ]; then
    echo "Uploading battle-logs.json..."
    wrangler r2 object put "$R2_BUCKET/legacy/battle-logs.json" --file="$DATA_DIR/battle-logs.json"
    echo "✓ battle-logs.json uploaded"
else
    echo "⚠ battle-logs.json not found, skipping"
fi

# my-decks.json
if [ -f "$DATA_DIR/my-decks.json" ]; then
    echo "Uploading my-decks.json..."
    wrangler r2 object put "$R2_BUCKET/legacy/my-decks.json" --file="$DATA_DIR/my-decks.json"
    echo "✓ my-decks.json uploaded"
else
    echo "⚠ my-decks.json not found, skipping"
fi

echo ""
echo "=== Upload Complete ==="
echo ""

# アップロード確認
echo "=== Verifying Upload ==="
wrangler r2 object list "$R2_BUCKET" --prefix="legacy/"

echo ""
echo "Done!"
