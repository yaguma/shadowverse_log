import { describe, expect, it } from 'vitest';
import {
  MyDeckCreateRequestSchema,
  DeckCodeOptionalSchema,
  DeckIdSchema,
} from '../my-deck.js';

describe('MyDeckCreateRequestSchema', () => {
  describe('正常系', () => {
    it('有効なdeckId、deckName、deckCodeでバリデーションが成功する', () => {
      // Given: 有効なdeckId、deckName、deckCodeが与えられる
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: 'テストデッキ',
        deckCode: 'ABC123',
      };

      // When: MyDeckCreateRequestSchemaでバリデーションする
      const result = MyDeckCreateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deckId).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.deckName).toBe('テストデッキ');
        expect(result.data.deckCode).toBe('ABC123');
      }
    });

    it('deckCodeが空文字でバリデーションが成功する', () => {
      // Given: deckCodeが空文字で与えられる
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: 'テストデッキ',
        deckCode: '',
      };

      // When: MyDeckCreateRequestSchemaでバリデーションする
      const result = MyDeckCreateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する（deckCodeは空白可）
      expect(result.success).toBe(true);
    });

    it('deckCodeがundefinedでバリデーションが成功する', () => {
      // Given: deckCodeがundefinedで与えられる
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: 'テストデッキ',
      };

      // When: MyDeckCreateRequestSchemaでバリデーションする
      const result = MyDeckCreateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する（deckCodeは空白可）
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deckCode).toBeUndefined();
      }
    });

    it('長いdeckCodeでもバリデーションが成功する', () => {
      // Given: 長いdeckCodeが与えられる（バリデーションなし）
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: 'テストデッキ',
        deckCode: 'A'.repeat(1000),
      };

      // When: MyDeckCreateRequestSchemaでバリデーションする
      const result = MyDeckCreateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する（deckCodeにはバリデーションを適用しない）
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('無効なUUID形式のdeckIdでエラーが返される', () => {
      const input = {
        deckId: 'invalid-uuid',
        deckName: 'テストデッキ',
        deckCode: 'ABC123',
      };

      const result = MyDeckCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckIdError = result.error.issues.find((e) => e.path[0] === 'deckId');
        expect(deckIdError?.message).toBe('無効なデッキIDです');
      }
    });

    it('空文字のdeckNameでエラーが返される', () => {
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: '',
        deckCode: 'ABC123',
      };

      const result = MyDeckCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は必須です');
      }
    });

    it('101文字のdeckNameでエラーが返される', () => {
      const input = {
        deckId: '123e4567-e89b-12d3-a456-426614174000',
        deckName: 'あ'.repeat(101),
        deckCode: 'ABC123',
      };

      const result = MyDeckCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は100文字以内で入力してください');
      }
    });

    it('deckIdがundefinedでエラーが返される', () => {
      const input = {
        deckName: 'テストデッキ',
        deckCode: 'ABC123',
      };

      const result = MyDeckCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe('DeckCodeOptionalSchema', () => {
  it('有効なデッキコードでバリデーションが成功する', () => {
    const result = DeckCodeOptionalSchema.safeParse('ABC123');
    expect(result.success).toBe(true);
  });

  it('空文字でバリデーションが成功する', () => {
    const result = DeckCodeOptionalSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('undefinedでバリデーションが成功する', () => {
    const result = DeckCodeOptionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('非常に長い文字列でもバリデーションが成功する', () => {
    const result = DeckCodeOptionalSchema.safeParse('X'.repeat(10000));
    expect(result.success).toBe(true);
  });
});

describe('DeckIdSchema', () => {
  it('有効なUUIDでバリデーションが成功する', () => {
    const result = DeckIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
    expect(result.success).toBe(true);
  });

  it('無効なUUIDでエラーが返される', () => {
    const result = DeckIdSchema.safeParse('invalid-uuid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('無効なデッキIDです');
    }
  });

  it('空文字でエラーが返される', () => {
    const result = DeckIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
