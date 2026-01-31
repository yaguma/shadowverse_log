/**
 * 【テストファイル概要】: MyDeckItemコンポーネントの単体テスト
 * 【テスト目的】: 使用デッキの個別アイテム表示、削除ボタン、削除確認ダイアログの機能を検証する
 * 【テスト範囲】: 表示テスト、削除ボタン、削除確認ダイアログ
 * 🔵 信頼性レベル: TASK-0019の要件に基づく
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DeckMaster, MyDeck } from '../../types';
import { MyDeckItem } from './MyDeckItem';

describe('MyDeckItem', () => {
  // ==================== テストデータ準備 ====================
  const createMockMyDeck = (overrides: Partial<MyDeck> = {}): MyDeck => ({
    id: 'my-deck-001',
    deckId: 'deck-master-001',
    deckCode: 'ABC123DEF456',
    deckName: '秘術オデンスペル',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  });

  const createMockDeckMaster = (overrides: Partial<DeckMaster> = {}): DeckMaster => ({
    id: 'deck-master-001',
    className: 'ウィッチ',
    deckName: '秘術ウィッチ',
    sortOrder: 1,
    ...overrides,
  });

  // ==================== 1. 表示テスト ====================

  describe('表示テスト', () => {
    it('TC-001: deckNameが表示されること', () => {
      // 【テスト目的】: deckNameが正しく表示されること 🔵
      // 【期待される動作】: "秘術オデンスペル"がDOMに存在

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: deckNameが表示されることを確認
      expect(screen.getByTestId('deck-name')).toHaveTextContent('秘術オデンスペル');
    });

    it('TC-002: deckCodeが表示されること', () => {
      // 【テスト目的】: deckCodeが正しく表示されること 🔵
      // 【期待される動作】: "ABC123DEF456"がDOMに存在

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: deckCodeが表示されることを確認
      expect(screen.getByTestId('deck-code')).toHaveTextContent('ABC123DEF456');
    });

    it('TC-003: classNameが表示されること', () => {
      // 【テスト目的】: classNameが正しく表示されること 🔵
      // 【期待される動作】: "ウィッチ"がDOMに存在

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: classNameが表示されることを確認
      expect(screen.getByTestId('deck-class-name')).toHaveTextContent('ウィッチ');
    });

    it('TC-007: deckCodeが空の場合は表示されないこと', () => {
      // 【テスト目的】: deckCode=''の場合はdeckCode要素が表示されないこと 🔵
      // 【期待される動作】: deck-code testIdが存在しない

      const myDeck = createMockMyDeck({ deckCode: '' });
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: deck-codeが表示されないことを確認
      expect(screen.queryByTestId('deck-code')).not.toBeInTheDocument();
    });

    it('TC-008: deckMasterがundefinedの場合、classNameは「-」が表示されること', () => {
      // 【テスト目的】: deckMasterがない場合はデフォルト表示になること 🔵
      // 【期待される動作】: "−"または"不明"がDOMに存在

      const myDeck = createMockMyDeck();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={undefined} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: classNameがデフォルト値であることを確認
      expect(screen.getByTestId('deck-class-name')).toHaveTextContent('-');
    });
  });

  // ==================== 2. 削除ボタンテスト ====================

  describe('削除ボタンテスト', () => {
    it('TC-004: 削除ボタンが表示されること', () => {
      // 【テスト目的】: 削除ボタンが表示されること 🔵
      // 【期待される動作】: 削除ボタンがDOMに存在

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: 削除ボタンが表示されることを確認
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    it('TC-005: canDelete=falseで削除ボタンが無効化されること', () => {
      // 【テスト目的】: canDelete=falseの場合、削除ボタンがdisabled状態になること 🔵
      // 【期待される動作】: 削除ボタンがdisabled

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={false} />
      );

      // 【結果検証】: 削除ボタンが無効化されていることを確認
      expect(screen.getByTestId('delete-button')).toBeDisabled();
    });

    it('TC-009: canDelete=trueで削除ボタンが有効であること', () => {
      // 【テスト目的】: canDelete=trueの場合、削除ボタンが有効であること 🔵
      // 【期待される動作】: 削除ボタンがenabled

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【結果検証】: 削除ボタンが有効であることを確認
      expect(screen.getByTestId('delete-button')).not.toBeDisabled();
    });

    it('TC-010: canDelete=falseでツールチップが表示されること', () => {
      // 【テスト目的】: canDelete=falseの場合、ホバー時にツールチップが表示されること 🔵
      // 【期待される動作】: title属性に「対戦履歴から参照されているため削除できません」

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={false} />
      );

      // 【結果検証】: ツールチップ用のtitle属性が存在することを確認
      expect(screen.getByTestId('delete-button')).toHaveAttribute(
        'title',
        '対戦履歴から参照されているため削除できません'
      );
    });
  });

  // ==================== 3. 削除確認ダイアログテスト ====================

  describe('削除確認ダイアログテスト', () => {
    it('TC-004: 削除ボタンクリックで確認ダイアログが表示されること', async () => {
      // 【テスト目的】: 削除ボタンクリック時に確認ダイアログが表示されること 🔵
      // 【期待される動作】: 確認ダイアログがDOMに存在

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【実際の処理実行】: 削除ボタンをクリック
      await userEvent.click(screen.getByTestId('delete-button'));

      // 【結果検証】: 確認ダイアログが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent(
          '「秘術オデンスペル」を削除してもよろしいですか？'
        );
      });
    });

    it('TC-006: 確認ダイアログで「削除」クリック時にonDeleteが呼び出されること', async () => {
      // 【テスト目的】: 確認ダイアログで削除ボタンクリック時にonDeleteがidと共に呼ばれること 🔵
      // 【期待される動作】: onDeleteがidと共に呼ばれる

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【実際の処理実行】: 削除ボタンをクリック → 確認ダイアログで削除ボタンをクリック
      await userEvent.click(screen.getByTestId('delete-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      // 【結果検証】: onDeleteがidと共に呼ばれることを確認
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith('my-deck-001');
    });

    it('TC-011: 確認ダイアログで「キャンセル」クリック時にダイアログが閉じること', async () => {
      // 【テスト目的】: キャンセルボタンクリック時にダイアログが閉じること 🔵
      // 【期待される動作】: ダイアログが閉じる

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【実際の処理実行】: 削除ボタンをクリック → キャンセルボタンをクリック
      await userEvent.click(screen.getByTestId('delete-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      // 【結果検証】: ダイアログが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    it('TC-012: 確認ダイアログで「キャンセル」クリック時にonDeleteが呼び出されないこと', async () => {
      // 【テスト目的】: キャンセルボタンクリック時にonDeleteが呼ばれないこと 🔵
      // 【期待される動作】: onDeleteが呼ばれない

      const myDeck = createMockMyDeck();
      const deckMaster = createMockDeckMaster();
      const onDelete = vi.fn();

      render(
        <MyDeckItem myDeck={myDeck} deckMaster={deckMaster} onDelete={onDelete} canDelete={true} />
      );

      // 【実際の処理実行】: 削除ボタンをクリック → キャンセルボタンをクリック
      await userEvent.click(screen.getByTestId('delete-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      // 【結果検証】: onDeleteが呼ばれないことを確認
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
