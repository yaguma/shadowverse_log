# 未使用エクスポートの整理（後方互換スキーマ）

## 概要

`packages/shared` のバリデーションモジュールに「後方互換性のため」とコメントされたスキーマや型が多数エクスポートされているが、実際にはどこからも使用されていない。これらは不要なコードとしてAPIを複雑にしている。

## 優先度

🟠 中

## 該当箇所

| ファイル | 行 | 未使用エクスポート |
|----------|-----|-------------------|
| `packages/shared/src/validation/index.ts` | 8-10 | `NewBattleLogSchema`, `UpdateBattleLogSchema`, `NewBattleLogInput` |
| `packages/shared/src/validation/index.ts` | 20-28 | `NewDeckMasterSchema`, `UpdateDeckMasterSchema`, `NewDeckMasterInput`, `UpdateDeckMasterInput` |
| `packages/shared/src/validation/index.ts` | 32-41 | `NewMyDeckSchema`, `UpdateMyDeckSchema`, `NewMyDeckInput`, `UpdateMyDeckInput` |

## 詳細

### 現在のエクスポート構造

```typescript
// packages/shared/src/validation/index.ts

// Battle Log - 使用されているもの
export { BattleTypeSchema, ... } from './battle-log';
export type { BattleType, ... } from './battle-log';

// Battle Log - 未使用（削除候補）
export { NewBattleLogSchema, UpdateBattleLogSchema } from './battle-log';
export type { NewBattleLogInput } from './battle-log';

// 同様のパターンが deck-master, my-deck にも存在
```

### 問題点

1. **「後方互換」の根拠なし**: レガシークライアントの存在証拠がない
2. **APIが使用していない**: APIは独自のスキーマを持っている（関連: #010）
3. **Webも使用していない**: フロントエンドでもインポートされていない
4. **公開APIの肥大化**: 不要なエクスポートがパッケージのAPIを複雑にする

### 未使用の確認方法

```bash
# プロジェクト全体で検索
grep -r "NewBattleLogSchema" apps/
grep -r "UpdateBattleLogSchema" apps/
# → 結果なし
```

## 改善案

### 未使用エクスポートを削除

```typescript
// packages/shared/src/validation/index.ts

// Battle Log
export {
  BattleTypeSchema,
  RankSchema,
  GroupSchema,
  TurnSchema,
  ResultSchema,
  CreateBattleLogRequestSchema,  // 実際に使用されるもののみ
} from './battle-log';

export type {
  BattleType,
  Rank,
  Group,
  Turn,
  Result,
  CreateBattleLogRequest,
} from './battle-log';

// NewBattleLogSchema, UpdateBattleLogSchema は削除
```

### 各バリデーションファイルも整理

- `battle-log.ts`: 未使用スキーマを削除
- `deck-master.ts`: 未使用スキーマを削除
- `my-deck.ts`: 未使用スキーマを削除

## 作業内容

- [ ] 各スキーマの使用状況を最終確認（grep検索）
- [ ] `packages/shared/src/validation/battle-log.ts` から未使用スキーマを削除
- [ ] `packages/shared/src/validation/deck-master.ts` から未使用スキーマを削除
- [ ] `packages/shared/src/validation/my-deck.ts` から未使用スキーマを削除
- [ ] `packages/shared/src/validation/index.ts` のエクスポートを更新
- [ ] 関連するテストを更新
- [ ] CHANGELOGに破壊的変更として記録（必要に応じて）
