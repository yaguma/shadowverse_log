# DeckStoreの複雑な状態管理

## 概要

`deckStore` に6つのerror/loading状態変数が存在し、状態管理が複雑になっている。AsyncState型を導入して簡素化すべき。

## 優先度

🟠 中

## 該当箇所

| ファイル | 行 |
|----------|-----|
| `apps/web/src/store/deckStore.ts` | 48-54 |

## 現状

```typescript
interface DeckState {
  deckMasters: DeckMaster[];
  myDecks: MyDeck[];
  deckMastersLoading: boolean;
  myDecksLoading: boolean;
  deckMastersError: string | null;
  myDecksError: string | null;
  // 追加のloading/error状態...
}
```

## 改善案

```typescript
// src/types/async-state.ts
interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

// deckStore.ts
interface DeckState {
  deckMasters: AsyncState<DeckMaster[]>;
  myDecks: AsyncState<MyDeck[]>;
}

// ヘルパー関数
const createInitialAsyncState = <T>(initial: T): AsyncState<T> => ({
  data: initial,
  isLoading: false,
  error: null,
});

const setLoading = <T>(state: AsyncState<T>): AsyncState<T> => ({
  ...state,
  isLoading: true,
  error: null,
});

const setSuccess = <T>(data: T): AsyncState<T> => ({
  data,
  isLoading: false,
  error: null,
});

const setError = <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
  ...state,
  isLoading: false,
  error,
});
```

## 作業内容

- [ ] `AsyncState<T>` 型を定義
- [ ] ヘルパー関数を作成
- [ ] `deckStore` をリファクタリング
- [ ] 他のStoreにも同様のパターンを適用検討
- [ ] テストを更新
