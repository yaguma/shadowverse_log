import { describe, expect, it } from 'vitest';
import {
  DeckMasterCreateRequestSchema,
  DeckMasterUpdateRequestSchema,
  ClassNameSchema,
  DeckNameSchema,
} from '../deck-master.js';

describe('DeckMasterCreateRequestSchema', () => {
  describe('正常系', () => {
    it('有効なclassNameとdeckNameでバリデーションが成功する', () => {
      // Given: 有効なclassName（"エルフ"）とdeckName（"テストデッキ"）が与えられる
      const input = {
        className: 'エルフ',
        deckName: 'テストデッキ',
      };

      // When: DeckMasterCreateRequestSchemaでバリデーションする
      const result = DeckMasterCreateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.className).toBe('エルフ');
        expect(result.data.deckName).toBe('テストデッキ');
      }
    });

    it('すべてのクラス名でバリデーションが成功する', () => {
      const classNames = [
        'エルフ',
        'ロイヤル',
        'ウィッチ',
        'ドラゴン',
        'ネクロマンサー',
        'ヴァンパイア',
        'ビショップ',
        'ネメシス',
      ];

      for (const className of classNames) {
        const input = { className, deckName: 'テストデッキ' };
        const result = DeckMasterCreateRequestSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it('deckNameが100文字ちょうどでバリデーションが成功する', () => {
      const input = {
        className: 'エルフ',
        deckName: 'あ'.repeat(100),
      };

      const result = DeckMasterCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('空文字のdeckNameでエラーが返される', () => {
      // Given: 空文字のdeckNameが与えられる
      const input = {
        className: 'エルフ',
        deckName: '',
      };

      // When: DeckMasterCreateRequestSchemaでバリデーションする
      const result = DeckMasterCreateRequestSchema.safeParse(input);

      // Then: "デッキ名は必須です"エラーが返される
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は必須です');
      }
    });

    it('101文字のdeckNameでエラーが返される', () => {
      // Given: 101文字のdeckNameが与えられる
      const input = {
        className: 'エルフ',
        deckName: 'あ'.repeat(101),
      };

      // When: DeckMasterCreateRequestSchemaでバリデーションする
      const result = DeckMasterCreateRequestSchema.safeParse(input);

      // Then: "デッキ名は100文字以内で入力してください"エラーが返される
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は100文字以内で入力してください');
      }
    });

    it('無効なclassNameでエラーが返される', () => {
      // Given: CLASS_NAMESに含まれない"無効クラス"が与えられる
      const input = {
        className: '無効クラス',
        deckName: 'テストデッキ',
      };

      // When: DeckMasterCreateRequestSchemaでバリデーションする
      const result = DeckMasterCreateRequestSchema.safeParse(input);

      // Then: "無効なクラス名です"エラーが返される
      expect(result.success).toBe(false);
      if (!result.success) {
        const classNameError = result.error.issues.find((e) => e.path[0] === 'className');
        expect(classNameError?.message).toBe('無効なクラス名です');
      }
    });

    it('deckNameがundefinedでエラーが返される', () => {
      const input = {
        className: 'エルフ',
      };

      const result = DeckMasterCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('classNameがundefinedでエラーが返される', () => {
      const input = {
        deckName: 'テストデッキ',
      };

      const result = DeckMasterCreateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

describe('DeckMasterUpdateRequestSchema', () => {
  describe('正常系', () => {
    it('有効なdeckNameでバリデーションが成功する', () => {
      // Given: 有効なdeckName（"更新デッキ名"）が与えられる
      const input = {
        deckName: '更新デッキ名',
      };

      // When: DeckMasterUpdateRequestSchemaでバリデーションする
      const result = DeckMasterUpdateRequestSchema.safeParse(input);

      // Then: バリデーションが成功する
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deckName).toBe('更新デッキ名');
      }
    });
  });

  describe('異常系', () => {
    it('空文字のdeckNameでエラーが返される', () => {
      const input = {
        deckName: '',
      };

      const result = DeckMasterUpdateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は必須です');
      }
    });

    it('101文字のdeckNameでエラーが返される', () => {
      const input = {
        deckName: 'あ'.repeat(101),
      };

      const result = DeckMasterUpdateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const deckNameError = result.error.issues.find((e) => e.path[0] === 'deckName');
        expect(deckNameError?.message).toBe('デッキ名は100文字以内で入力してください');
      }
    });
  });
});

describe('ClassNameSchema', () => {
  it('有効なクラス名でバリデーションが成功する', () => {
    const result = ClassNameSchema.safeParse('エルフ');
    expect(result.success).toBe(true);
  });

  it('無効なクラス名でエラーが返される', () => {
    const result = ClassNameSchema.safeParse('無効クラス');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('無効なクラス名です');
    }
  });
});

describe('DeckNameSchema', () => {
  it('有効なデッキ名でバリデーションが成功する', () => {
    const result = DeckNameSchema.safeParse('テストデッキ');
    expect(result.success).toBe(true);
  });

  it('空文字でエラーが返される', () => {
    const result = DeckNameSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('デッキ名は必須です');
    }
  });

  it('101文字でエラーが返される', () => {
    const result = DeckNameSchema.safeParse('あ'.repeat(101));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('デッキ名は100文字以内で入力してください');
    }
  });
});
