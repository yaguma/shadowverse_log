# 統計画面バグ修正 - Phase 1

## フェーズ情報

- **要件名**: statistics-bugfix
- **フェーズ**: Phase 1
- **期間**: Day 1
- **目標**: byTurnフィールドの日本語キー対応によるバグ修正
- **成果物**: 統計画面が正常に表示されること
- **対象タスク**: TASK-0047 (1タスク)
- **総工数**: 1時間
- **信頼性レベル**: 🔵 青信号

---

## Day 1 計画

### 目標
- バックエンドの `byTurn` フィールドを日本語キー（`先攻`/`後攻`）に修正
- テストを更新して全テストが通過することを確認

### 成果物
- 修正された `d1-statistics-service.ts`
- 修正された `d1-statistics-service.test.ts`
- 全テスト通過

---

## タスク詳細

### TASK-0047: byTurn フィールドの日本語キー対応

| 項目 | 内容 |
|------|------|
| **タスクID** | TASK-0047 |
| **タスク名** | byTurn フィールドの日本語キー対応 |
| **タスクタイプ** | TDD |
| **推定工数** | 1時間 |
| **要件リンク** | 統計画面エラー修正 |
| **依存タスク** | なし |
| **要件名** | statistics-bugfix |
| **信頼性レベル** | 🔵 青信号 |

#### 問題の背景

統計画面で以下のエラーが発生：
- フロントエンドが `turnStats.先攻.totalGames` にアクセス
- バックエンドは `{ first: ..., second: ... }` を返す
- `undefined` のプロパティにアクセスしてランタイムエラー発生

#### 修正対象ファイル

1. **`backend/src/services/d1-statistics-service.ts`**
   - `StatisticsResult` 型定義（行50-59）
   - `calculateByTurn` メソッド（行285-330）

2. **`backend/tests/services/d1-statistics-service.test.ts`**
   - テスト期待値（行209-212）

#### 実装詳細

##### 1. 型定義の修正

**Before:**
```typescript
export interface StatisticsResult {
  // ...
  byTurn: {
    first: OverallStatistics;
    second: OverallStatistics;
  };
}
```

**After:**
```typescript
export interface StatisticsResult {
  // ...
  byTurn: {
    先攻: OverallStatistics;
    後攻: OverallStatistics;
  };
}
```

##### 2. calculateByTurn メソッドの修正

**Before:**
```typescript
private calculateByTurn(logs: ...): {
  first: OverallStatistics;
  second: OverallStatistics;
} {
  // ...
  return {
    first: { ...stats.first, winRate: ... },
    second: { ...stats.second, winRate: ... },
  };
}
```

**After:**
```typescript
private calculateByTurn(logs: ...): {
  先攻: OverallStatistics;
  後攻: OverallStatistics;
} {
  // ...
  return {
    先攻: { ...stats.first, winRate: ... },
    後攻: { ...stats.second, winRate: ... },
  };
}
```

##### 3. テストの修正

**Before:**
```typescript
expect(result.byTurn.first).toBeDefined();
expect(result.byTurn.second).toBeDefined();
expect(result.byTurn.first.totalGames).toBeGreaterThanOrEqual(0);
expect(result.byTurn.second.totalGames).toBeGreaterThanOrEqual(0);
```

**After:**
```typescript
expect(result.byTurn.先攻).toBeDefined();
expect(result.byTurn.後攻).toBeDefined();
expect(result.byTurn.先攻.totalGames).toBeGreaterThanOrEqual(0);
expect(result.byTurn.後攻.totalGames).toBeGreaterThanOrEqual(0);
```

#### 完了条件

- [x] 型定義が日本語キーに変更されている
- [x] calculateByTurnメソッドが日本語キーを返す
- [x] テストの期待値が日本語キーに変更されている
- [x] 全テストが通過する（`pnpm test`）- 221テスト通過
- [x] TypeScript型エラーなし（修正対象ファイルに限る）
- [ ] 統計画面がエラーなく表示される

#### テスト要件

| テストケース | 説明 | 期待結果 |
|--------------|------|----------|
| TC-001 | byTurn構造確認 | `先攻` と `後攻` キーが存在する |
| TC-002 | 先攻統計値確認 | totalGames >= 0 |
| TC-003 | 後攻統計値確認 | totalGames >= 0 |

#### TDDコマンド

```
/tdd-requirements TASK-0047
/tdd-testcases TASK-0047
/tdd-red TASK-0047
/tdd-green TASK-0047
/tdd-refactor TASK-0047
/tdd-verify-complete TASK-0047
```

---

## 進捗状況

- [x] TASK-0047: byTurn フィールドの日本語キー対応

---

## 完了履歴

| タスク | ステータス | 完了日 |
|--------|-----------|--------|
| TASK-0047 | ✅ 完了 | 2025-12-05 |
