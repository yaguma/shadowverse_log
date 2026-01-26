import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodErrorToValidationError, validate } from '../utils.js';

describe('zodErrorToValidationError', () => {
  it('ZodErrorオブジェクトをValidationError形式に変換する', () => {
    // Given: ZodErrorオブジェクトが与えられる
    const schema = z.object({
      name: z.string().min(1, '名前は必須です'),
    });
    const result = schema.safeParse({ name: '' });

    if (!result.success) {
      // When: zodErrorToValidationError関数を呼び出す
      const validationError = zodErrorToValidationError(result.error);

      // Then: ValidationError形式に変換される
      expect(validationError.code).toBe('VALIDATION_ERROR');
      expect(validationError.message).toBe('バリデーションエラー');
      expect(validationError.details).toHaveLength(1);
      expect(validationError.details[0].field).toBe('name');
      expect(validationError.details[0].constraint).toBe('too_small');
    }
  });

  it('複数のエラーを含むZodErrorを変換する', () => {
    const schema = z.object({
      name: z.string().min(1, '名前は必須です'),
      email: z.string().email('有効なメールアドレスを入力してください'),
    });
    const result = schema.safeParse({ name: '', email: 'invalid' });

    if (!result.success) {
      const validationError = zodErrorToValidationError(result.error);

      expect(validationError.details).toHaveLength(2);
      expect(validationError.details.find((d) => d.field === 'name')).toBeDefined();
      expect(validationError.details.find((d) => d.field === 'email')).toBeDefined();
    }
  });

  it('ネストしたオブジェクトのエラーでフィールドパスが正しく連結される', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1, '名前は必須です'),
        }),
      }),
    });
    const result = schema.safeParse({ user: { profile: { name: '' } } });

    if (!result.success) {
      const validationError = zodErrorToValidationError(result.error);

      expect(validationError.details[0].field).toBe('user.profile.name');
    }
  });
});

describe('validate', () => {
  const testSchema = z.object({
    name: z.string().min(1, '名前は必須です'),
    age: z.number().positive('年齢は正の数である必要があります'),
  });

  describe('正常系', () => {
    it('有効なデータでバリデーションが成功する', () => {
      // Given: 有効なデータが与えられる
      const data = { name: 'テスト', age: 25 };

      // When: validate関数を呼び出す
      const result = validate(testSchema, data);

      // Then: 成功結果が返される
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('テスト');
        expect(result.data.age).toBe(25);
      }
    });
  });

  describe('異常系', () => {
    it('無効なデータでバリデーションが失敗する', () => {
      // Given: 無効なデータが与えられる
      const data = { name: '', age: -1 };

      // When: validate関数を呼び出す
      const result = validate(testSchema, data);

      // Then: 失敗結果とValidationErrorが返される
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details.length).toBeGreaterThan(0);
      }
    });

    it('undefinedでバリデーションが失敗する', () => {
      const result = validate(testSchema, undefined);

      expect(result.success).toBe(false);
    });

    it('nullでバリデーションが失敗する', () => {
      const result = validate(testSchema, null);

      expect(result.success).toBe(false);
    });
  });
});
