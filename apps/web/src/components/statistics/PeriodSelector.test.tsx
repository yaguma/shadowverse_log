import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PeriodSelector } from './PeriodSelector';

// 【テストファイル概要】: PeriodSelector（期間選択フォーム）コンポーネントの単体テスト
// 【テスト目的】: 期間選択の基本操作、入力変更、ローディング状態の動作を検証
// 【テスト範囲】: 正常系（6ケース）
// 🔵 信頼性レベル: REQ-202、TASK-0037要件定義書に基づいた実装

describe('PeriodSelector', () => {
  // ==================== 1. 正常系テストケース ====================

  describe('正常系テスト', () => {
    it('TC-PERIOD-001: 開始日と終了日の入力フィールドが表示される', () => {
      // 【テスト目的】: PeriodSelectorコンポーネントの基本的な表示機能を確認
      // 【テスト内容】: 開始日、終了日の入力フィールドと検索ボタンが表示されることをテスト
      // 【期待される動作】: 2つのdate inputと1つのボタンが表示される
      // 🔵 信頼性レベル: REQ-202、受け入れ基準TC-PERIOD-001に基づく

      // ========== Given: テストデータ準備 ==========
      // 【テストデータ準備】: 標準的な期間データを用意
      // 【初期条件設定】: 過去7日間のデフォルト期間
      // 【前提条件確認】: REQ-202の基本要件を満たすための代表的なデータ
      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      // ========== When: 実際の処理実行 ==========
      // 【実際の処理実行】: PeriodSelectorコンポーネントをレンダリング
      // 【処理内容】: 2つの入力フィールドと検索ボタンが描画される
      // 【実行タイミング】: テスト開始時に一度だけ実行
      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={false}
        />
      );

      // ========== Then: 結果検証 ==========
      // 【結果検証】: フォーム要素が正しく表示されることを確認
      // 【期待値確認】: 各入力フィールドとボタンが正しく表示される
      // 【品質保証】: 基本的なフォーム表示機能が正常に動作することを保証

      // 【検証項目】: 開始日ラベルが表示される
      // 🔵 信頼性レベル: REQ-202に基づく
      expect(screen.getByText('開始日')).toBeInTheDocument();

      // 【検証項目】: 終了日ラベルが表示される
      // 🔵 信頼性レベル: REQ-202に基づく
      expect(screen.getByText('終了日')).toBeInTheDocument();

      // 【検証項目】: 開始日入力フィールドが表示される
      // 🔵 信頼性レベル: REQ-202に基づく
      const startDateInput = screen.getByLabelText('開始日') as HTMLInputElement;
      expect(startDateInput).toBeInTheDocument();
      expect(startDateInput.type).toBe('date');
      expect(startDateInput.value).toBe(mockStartDate);

      // 【検証項目】: 終了日入力フィールドが表示される
      // 🔵 信頼性レベル: REQ-202に基づく
      const endDateInput = screen.getByLabelText('終了日') as HTMLInputElement;
      expect(endDateInput).toBeInTheDocument();
      expect(endDateInput.type).toBe('date');
      expect(endDateInput.value).toBe(mockEndDate);

      // 【検証項目】: 検索ボタンが表示される
      // 🔵 信頼性レベル: REQ-202に基づく
      const searchButton = screen.getByRole('button', { name: '検索' });
      expect(searchButton).toBeInTheDocument();
    });

    it('TC-PERIOD-002: 開始日を変更できる', async () => {
      // 【テスト目的】: 開始日入力フィールドの変更機能を確認
      // 【テスト内容】: 開始日を変更した際、onStartDateChangeコールバックが呼ばれることをテスト
      // 【期待される動作】: 入力変更時にコールバックが正しい引数で呼ばれる
      // 🔵 信頼性レベル: REQ-202、受け入れ基準TC-PERIOD-002に基づく

      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      const user = userEvent.setup();
      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={false}
        />
      );

      // 【検証項目】: 開始日入力フィールドを変更する
      // 🔵 信頼性レベル: REQ-202に基づく
      const startDateInput = screen.getByLabelText('開始日') as HTMLInputElement;
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-01-10');

      // 【検証項目】: onStartDateChangeコールバックが呼ばれる
      // 🔵 信頼性レベル: REQ-202に基づく
      expect(mockOnStartDateChange).toHaveBeenCalled();
    });

    it('TC-PERIOD-003: 終了日を変更できる', async () => {
      // 【テスト目的】: 終了日入力フィールドの変更機能を確認
      // 【テスト内容】: 終了日を変更した際、onEndDateChangeコールバックが呼ばれることをテスト
      // 【期待される動作】: 入力変更時にコールバックが正しい引数で呼ばれる
      // 🔵 信頼性レベル: REQ-202、受け入れ基準TC-PERIOD-003に基づく

      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      const user = userEvent.setup();
      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={false}
        />
      );

      // 【検証項目】: 終了日入力フィールドを変更する
      // 🔵 信頼性レベル: REQ-202に基づく
      const endDateInput = screen.getByLabelText('終了日') as HTMLInputElement;
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-01-31');

      // 【検証項目】: onEndDateChangeコールバックが呼ばれる
      // 🔵 信頼性レベル: REQ-202に基づく
      expect(mockOnEndDateChange).toHaveBeenCalled();
    });

    it('TC-PERIOD-004: 検索ボタンをクリックするとonSearchコールバックが呼ばれる', async () => {
      // 【テスト目的】: 検索ボタンのクリック機能を確認
      // 【テスト内容】: 検索ボタンをクリックした際、onSearchコールバックが呼ばれることをテスト
      // 【期待される動作】: ボタンクリック時にコールバックが呼ばれる
      // 🔵 信頼性レベル: REQ-202、受け入れ基準TC-PERIOD-004に基づく

      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      const user = userEvent.setup();
      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={false}
        />
      );

      // 【検証項目】: 検索ボタンをクリックする
      // 🔵 信頼性レベル: REQ-202に基づく
      const searchButton = screen.getByRole('button', { name: '検索' });
      await user.click(searchButton);

      // 【検証項目】: onSearchコールバックが呼ばれる
      // 🔵 信頼性レベル: REQ-202に基づく
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    });

    it('TC-PERIOD-005: ローディング中は入力フィールドとボタンが無効化される', () => {
      // 【テスト目的】: ローディング状態の無効化機能を確認
      // 【テスト内容】: isLoading=trueの場合、入力フィールドとボタンが無効化されることをテスト
      // 【期待される動作】: disabled属性が適用され、操作不可になる
      // 🔵 信頼性レベル: REQ-202、受け入れ基準TC-PERIOD-005に基づく

      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={true}
        />
      );

      // 【検証項目】: 開始日入力フィールドが無効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const startDateInput = screen.getByLabelText('開始日') as HTMLInputElement;
      expect(startDateInput).toBeDisabled();

      // 【検証項目】: 終了日入力フィールドが無効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const endDateInput = screen.getByLabelText('終了日') as HTMLInputElement;
      expect(endDateInput).toBeDisabled();

      // 【検証項目】: 検索ボタンが無効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const searchButton = screen.getByRole('button', { name: '検索' });
      expect(searchButton).toBeDisabled();
    });

    it('TC-PERIOD-006: ローディング中でない場合は入力フィールドとボタンが有効化される', () => {
      // 【テスト目的】: 通常状態の有効化機能を確認
      // 【テスト内容】: isLoading=falseの場合、入力フィールドとボタンが有効化されることをテスト
      // 【期待される動作】: disabled属性が適用されず、操作可能になる
      // 🔵 信頼性レベル: REQ-202に基づく

      const mockStartDate = '2025-01-17';
      const mockEndDate = '2025-01-24';
      const mockOnStartDateChange = vi.fn();
      const mockOnEndDateChange = vi.fn();
      const mockOnSearch = vi.fn();

      render(
        <PeriodSelector
          startDate={mockStartDate}
          endDate={mockEndDate}
          onStartDateChange={mockOnStartDateChange}
          onEndDateChange={mockOnEndDateChange}
          onSearch={mockOnSearch}
          isLoading={false}
        />
      );

      // 【検証項目】: 開始日入力フィールドが有効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const startDateInput = screen.getByLabelText('開始日') as HTMLInputElement;
      expect(startDateInput).not.toBeDisabled();

      // 【検証項目】: 終了日入力フィールドが有効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const endDateInput = screen.getByLabelText('終了日') as HTMLInputElement;
      expect(endDateInput).not.toBeDisabled();

      // 【検証項目】: 検索ボタンが有効化される
      // 🔵 信頼性レベル: REQ-202に基づく
      const searchButton = screen.getByRole('button', { name: '検索' });
      expect(searchButton).not.toBeDisabled();
    });
  });
});
