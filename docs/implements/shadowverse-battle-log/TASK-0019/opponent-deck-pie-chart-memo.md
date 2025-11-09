# TDD開発メモ: OpponentDeckPieChart（対戦相手デッキ分布円グラフ）

## 概要

- **機能名**: OpponentDeckPieChart（対戦相手デッキ分布円グラフコンポーネント）
- **開発開始**: 2025-11-09 23:33
- **現在のフェーズ**: Red（失敗するテスト作成完了）
- **開発方針**: TDD（Test-Driven Development）

## 関連ファイル

- **元タスクファイル**: `docs/spec/task-0019-requirements.md`
- **要件定義**: `docs/spec/task-0019-requirements.md`
- **受け入れ基準**: `docs/spec/task-0019-acceptance-criteria.md`
- **テストケース定義**: `docs/implements/shadowverse-battle-log/TASK-0019/opponent-deck-pie-chart-testcases.md`
- **実装ファイル**: `frontend/src/components/statistics/OpponentDeckPieChart.tsx`（未作成）
- **テストファイル**: `frontend/src/components/statistics/OpponentDeckPieChart.test.tsx`（作成完了）

---

## Redフェーズ（失敗するテスト作成）

### 作成日時

2025-11-09 23:33

### 作成したテストケース

以下の10ケースのテストケースを実装しました（目標: 10ケース以上）：

#### 正常系テストケース（4ケース）

1. **TC-GRAPH-001**: 複数の相手デッキが存在する場合、円グラフが正しく表示される 🔵
   - 4種類のデッキデータで円グラフが正しく描画されることを確認
   - セグメント数、凡例表示の検証

2. **TC-GRAPH-002**: 各セグメントが異なる色で表示される 🔵
   - カラーパレットの適用確認
   - 各セグメントのfill属性が異なることを検証

3. **TC-GRAPH-003**: 凡例にデッキ名と対戦回数が表示される 🔵
   - 「デッキ名: X回」形式の凡例表示を確認
   - フォントサイズが12px以上であることを検証

4. **TC-GRAPH-007**: 円グラフがアニメーションなしで即座に表示される 🔵
   - 描画時間が500ms以内であることを確認
   - アニメーション無効化の検証

#### 異常系テストケース（3ケース）

5. **TC-GRAPH-009**: データが0件の場合、「データなし」メッセージが表示される 🟡
   - 空配列の場合のフォールバック処理を確認
   - 円グラフが表示されないことを検証

6. **TC-GRAPH-010**: Recharts描画エラー時にエラーメッセージが表示される 🟡
   - エラーバウンダリの動作確認
   - アプリケーション全体がクラッシュしないことを検証

7. **TC-GRAPH-011**: 不正なデータ形式の場合にエラーハンドリングされる 🟡
   - null、undefined、型不一致データのハンドリング確認
   - システムの安全性を検証

#### 境界値テストケース（3ケース）

8. **TC-GRAPH-012**: 対戦相手が1種類のみの場合、100%の単一セグメントが表示される 🟡
   - 最小データセット（1件）での動作確認
   - 単一セグメントの正常表示を検証

9. **TC-GRAPH-013**: 対戦相手デッキが20種類以上の場合でも円グラフが正しく表示される 🟡
   - 大量データ（25件）でのスケーラビリティ確認
   - セグメントの視認性を検証

10. **TC-GRAPH-014**: 対戦回数が1回のデッキもセグメントとして表示される 🟡
    - 最小対戦回数（1回）でのセグメント表示確認
    - 小さなセグメントの視認性を検証

### テストコード概要

テストファイル: `frontend/src/components/statistics/OpponentDeckPieChart.test.tsx`

- **テストフレームワーク**: Vitest + React Testing Library
- **総テストケース数**: 10ケース
  - 正常系: 4ケース
  - 異常系: 3ケース
  - 境界値: 3ケース
- **信頼性レベル内訳**:
  - 🔵 青信号（高信頼性）: 4ケース
  - 🟡 黄信号（妥当な推測）: 6ケース

### テストコードの特徴

1. **Given-When-Thenパターン採用**
   - テスト構造が明確で読みやすい
   - 各フェーズに詳細な日本語コメントを記載

2. **信頼性レベルの明記**
   - 各テストケースに🔵🟡🔴の信号を付与
   - 要件定義書との対応関係を明確化

3. **詳細な日本語コメント**
   - テスト目的、テスト内容、期待される動作を明記
   - 各expectステートメントに確認内容を記載

4. **実装詳細に依存しないテスト**
   - ユーザー視点の振る舞いをテスト
   - DOMクエリは最小限に抑制

### 期待される失敗メッセージ

```
Error: Failed to resolve import "./OpponentDeckPieChart" from "src/components/statistics/OpponentDeckPieChart.test.tsx". Does the file exist?
```

**失敗理由**: OpponentDeckPieChart.tsxファイルがまだ作成されていないため、インポートエラーが発生します。これは正常なTDD Redフェーズの動作です。

### テスト実行コマンド

```bash
# 全テスト実行
cd frontend && pnpm test

# OpponentDeckPieChartのテストのみ実行
cd frontend && pnpm test OpponentDeckPieChart.test.tsx

# ウォッチモードで実行
cd frontend && pnpm test OpponentDeckPieChart.test.tsx --watch

# カバレッジ付きで実行
cd frontend && pnpm test:coverage OpponentDeckPieChart.test.tsx
```

### 次のフェーズへの要求事項

Greenフェーズで実装すべき内容：

#### 1. OpponentDeckPieChartコンポーネント作成

**ファイルパス**: `frontend/src/components/statistics/OpponentDeckPieChart.tsx`

**必須実装内容**:
- Props定義: `{ data: StatisticsResponse['byOpponentDeck'] }`
- Recharts PieChartコンポーネントの使用
- データ変換処理（totalGamesを基に割合を計算）
- カラーパレット適用
- 凡例の表示（「デッキ名: X回」形式）
- ツールチップの実装
- アニメーション無効化（`isAnimationActive={false}`）
- 空データ時のフォールバック表示
- エラーバウンダリの実装

#### 2. カラーパレット定義

**ファイルパス**: `frontend/src/constants/deckColors.ts`（新規作成）

**必須実装内容**:
- デッキタイプごとの固定カラーパレット定義
- 色覚多様性に配慮したカラー選定（ColorBrewer2のSet2パレット等）
- 最大20種類以上のデッキに対応できる色数

#### 3. 型定義の追加（必要に応じて）

**ファイルパス**: `frontend/src/types/index.ts`

**必須実装内容**:
- OpponentDeckPieChartPropsの型定義（必要に応じて）
- PieChartDataの型定義（データ変換後の形式）

### 実装時の注意事項

1. **最小実装の原則**
   - テストを通すために必要最小限の実装のみを行う
   - 過度な最適化やリファクタリングはRefactorフェーズで実施

2. **Rechartsの使用**
   - PieChart、Pie、Legend、Tooltip、Cell、ResponsiveContainerコンポーネントを使用
   - `isAnimationActive={false}`でアニメーションを無効化
   - `aria-label="対戦相手デッキ分布"`でアクセシビリティ対応

3. **エラーハンドリング**
   - データが空配列の場合の処理
   - 不正なデータ形式の場合の処理
   - Recharts描画エラーのキャッチ（ErrorBoundary使用）

4. **レスポンシブ対応**
   - ResponsiveContainerで親要素のサイズに追従
   - アスペクト比を1（正円形）に固定

---

## Greenフェーズ（最小実装）

### 実装日時

（未実施）

### 実装方針

（Green フェーズで記載）

### 実装コード

（Green フェーズで記載）

### テスト結果

（Green フェーズで記載）

### 課題・改善点

（Green フェーズで記載）

---

## Refactorフェーズ（品質改善）

### リファクタ日時

（未実施）

### 改善内容

（Refactor フェーズで記載）

### セキュリティレビュー

（Refactor フェーズで記載）

### パフォーマンスレビュー

（Refactor フェーズで記載）

### 最終コード

（Refactor フェーズで記載）

### 品質評価

（Refactor フェーズで記載）

---

## 開発履歴

| 日時 | フェーズ | 内容 | 結果 |
|------|---------|------|------|
| 2025-11-09 23:33 | Red | テストケース10件作成 | ✅ 失敗することを確認 |

---

## メモ・コメント

### Redフェーズの品質判定

✅ **高品質**:
- テスト実行: 成功（失敗することを確認済み）
- 期待値: 明確で具体的
- アサーション: 適切で網羅的
- 実装方針: 明確（次のフェーズへの要求事項を詳細に記載）

### 次のステップ

次のお勧めステップ: `/tsumiki:tdd-green` でGreenフェーズ（最小実装）を開始します。

Greenフェーズでは、以下のファイルを作成します：
1. `frontend/src/components/statistics/OpponentDeckPieChart.tsx`
2. `frontend/src/constants/deckColors.ts`

すべてのテストが通るまで、最小限の実装を繰り返します。
