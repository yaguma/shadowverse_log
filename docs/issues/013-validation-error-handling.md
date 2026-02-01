# バリデーションエラー処理の改善

## 概要

`packages/shared` のバリデーションエラー処理に複数の問題がある。`ValidationError` の `value` フィールドが常に `undefined` になり、Zodのエラーコードマッピングも不完全なため、ユーザーに適切なエラーメッセージを表示できない。

## 優先度

🟠 中

## 該当箇所

| ファイル | 行 | 問題 |
|----------|-----|------|
| `packages/shared/src/validation/utils.ts` | 15 | `value: undefined` が固定 |
| `packages/shared/src/utils/error-handling.ts` | 39-46 | Zodエラーコードのマッピング不完全 |

## 詳細

### 問題1: ValidationError の value が常に undefined

```typescript
// packages/shared/src/validation/utils.ts
export function zodErrorToValidationError(zodError: ZodError): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'バリデーションエラー',
    details: zodError.issues.map((err) => ({
      field: err.path.join('.'),
      constraint: err.code,
      value: undefined,  // ← 常にundefined
    })),
  };
}
```

**影響:**
- デバッグ時に実際の入力値がわからない
- 動的エラーメッセージ（「○文字以上」等）が生成できない

### 問題2: Zodエラーコードのマッピング不完全

```typescript
// packages/shared/src/utils/error-handling.ts
const translations: Record<string, string> = {
  required: '必須項目です',
  minLength: `${value}文字以上で入力してください`,
  maxLength: `${value}文字以下で入力してください`,
  invalidClassName: '無効なクラス名です',
};
```

**問題:**
- Zodの実際のエラーコードは `too_small`, `too_big`, `invalid_enum` 等
- 上記のキー（`required`, `minLength`）はZodのコードではない
- 結果、常にデフォルトの `バリデーションエラー: {code}` が表示される

### Zodの実際のエラーコード

```typescript
type ZodIssueCode =
  | 'invalid_type'
  | 'invalid_literal'
  | 'custom'
  | 'invalid_union'
  | 'invalid_union_discriminator'
  | 'invalid_enum_value'
  | 'unrecognized_keys'
  | 'invalid_arguments'
  | 'invalid_return_type'
  | 'invalid_date'
  | 'invalid_string'
  | 'too_small'
  | 'too_big'
  | 'invalid_intersection_types'
  | 'not_multiple_of'
  | 'not_finite';
```

## 改善案

### validation/utils.ts の修正

```typescript
export function zodErrorToValidationError(zodError: ZodError): ValidationError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'バリデーションエラー',
    details: zodError.issues.map((err) => ({
      field: err.path.join('.'),
      constraint: err.code,
      value: getIssueValue(err),  // 実際の値を取得
      message: getJapaneseMessage(err),  // 日本語メッセージを追加
    })),
  };
}

function getIssueValue(issue: ZodIssue): unknown {
  if ('received' in issue) return issue.received;
  if ('minimum' in issue) return issue.minimum;
  if ('maximum' in issue) return issue.maximum;
  return undefined;
}
```

### error-handling.ts の修正

```typescript
function getJapaneseMessage(issue: ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined'
        ? '必須項目です'
        : `${issue.expected}型で入力してください`;

    case 'too_small':
      if (issue.type === 'string') {
        return `${issue.minimum}文字以上で入力してください`;
      }
      return `${issue.minimum}以上の値を入力してください`;

    case 'too_big':
      if (issue.type === 'string') {
        return `${issue.maximum}文字以下で入力してください`;
      }
      return `${issue.maximum}以下の値を入力してください`;

    case 'invalid_enum_value':
      return `無効な値です。選択肢: ${issue.options.join(', ')}`;

    default:
      return issue.message;
  }
}
```

## 作業内容

- [ ] `packages/shared/src/types/api.ts` の `ValidationError` 型に `message` フィールドを追加
- [ ] `packages/shared/src/validation/utils.ts` で値とメッセージを正しく設定
- [ ] `packages/shared/src/utils/error-handling.ts` のマッピングを修正
- [ ] Zodエラーコードごとの日本語メッセージを追加
- [ ] バリデーションエラー表示のテストを追加
- [ ] フロントエンドのエラー表示コンポーネントを更新
