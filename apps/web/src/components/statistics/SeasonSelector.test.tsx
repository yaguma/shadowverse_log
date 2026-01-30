/**
 * SeasonSelector コンポーネントのテスト
 * TASK-0028: 統計画面シーズン選択UI実装
 * 🔵 信頼性レベル: タスク仕様書のテスト要件に準拠
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeasonSelector } from './SeasonSelector';

describe('SeasonSelector', () => {
  const mockOnSeasonChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('propsモード（従来の使用方法）', () => {
    it('シーズン選択ラベルが表示される', () => {
      render(<SeasonSelector season={5} onSeasonChange={mockOnSeasonChange} isLoading={false} />);

      expect(screen.getByText('シーズン')).toBeInTheDocument();
    });

    it('シーズン値が入力フィールドに表示される', () => {
      render(<SeasonSelector season={5} onSeasonChange={mockOnSeasonChange} isLoading={false} />);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('5');
    });

    it('シーズンがundefinedの場合、入力フィールドが空になる', () => {
      render(
        <SeasonSelector season={undefined} onSeasonChange={mockOnSeasonChange} isLoading={false} />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('シーズン変更でonSeasonChangeが呼ばれる', () => {
      render(<SeasonSelector season={5} onSeasonChange={mockOnSeasonChange} isLoading={false} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '3' } });

      expect(mockOnSeasonChange).toHaveBeenCalledWith(3);
    });

    it('入力をクリアするとonSeasonChangeがundefinedで呼ばれる', () => {
      render(<SeasonSelector season={5} onSeasonChange={mockOnSeasonChange} isLoading={false} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnSeasonChange).toHaveBeenCalledWith(undefined);
    });

    it('ローディング中は入力フィールドがdisabledになる', () => {
      render(<SeasonSelector season={5} onSeasonChange={mockOnSeasonChange} isLoading={true} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('placeholderに"全て"が表示される', () => {
      render(
        <SeasonSelector season={undefined} onSeasonChange={mockOnSeasonChange} isLoading={false} />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.placeholder).toBe('全て');
    });
  });

  describe('ドロップダウンモード（シーズン一覧がある場合）', () => {
    it('シーズン選択肢がドロップダウンとして表示される', () => {
      render(
        <SeasonSelector
          season={5}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          availableSeasons={[5, 4, 3, 2, 1]}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('シーズン 5')).toBeInTheDocument();
      expect(screen.getByText('シーズン 1')).toBeInTheDocument();
    });

    it('初期表示で指定されたシーズンが選択されている', () => {
      render(
        <SeasonSelector
          season={5}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          availableSeasons={[5, 4, 3]}
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('5');
    });

    it('シーズン変更でonSeasonChangeが呼ばれる', () => {
      render(
        <SeasonSelector
          season={5}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          availableSeasons={[5, 4, 3]}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '3' } });

      expect(mockOnSeasonChange).toHaveBeenCalledWith(3);
    });

    it('「すべて」を選択するとonSeasonChangeがundefinedで呼ばれる', () => {
      render(
        <SeasonSelector
          season={5}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          availableSeasons={[5, 4, 3]}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });

      expect(mockOnSeasonChange).toHaveBeenCalledWith(undefined);
    });

    it('ローディング中はドロップダウンがdisabledになる', () => {
      render(
        <SeasonSelector
          season={5}
          onSeasonChange={mockOnSeasonChange}
          isLoading={true}
          availableSeasons={[5, 4, 3]}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  describe('ローディング状態', () => {
    it('シーズン読み込み中はローディングテキストが表示される', () => {
      render(
        <SeasonSelector
          season={undefined}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          isSeasonsLoading={true}
        />
      );

      expect(screen.getByText('シーズン読み込み中...')).toBeInTheDocument();
    });
  });

  describe('シーズンなし状態', () => {
    it('シーズンがない場合はメッセージが表示される', () => {
      render(
        <SeasonSelector
          season={undefined}
          onSeasonChange={mockOnSeasonChange}
          isLoading={false}
          availableSeasons={[]}
          isSeasonsLoading={false}
        />
      );

      expect(screen.getByText('シーズンデータがありません')).toBeInTheDocument();
    });
  });
});
