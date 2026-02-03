/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: タブ切り替えによるデッキ種別管理とマイデッキ管理の統合画面
 * 【リファクタリング】: Issue 005対応 - 未実装ハンドラを実装
 * 【タスク】: TASK-0022, TASK-0023
 * 🔵 信頼性レベル: architecture.md 2.3に基づく
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tab } from '../components/common/Tabs';
import { Tabs } from '../components/common/Tabs';
import { DeckMasterDialog } from '../components/deck-master/DeckMasterDialog';
import { DeckMasterList } from '../components/deck-master/DeckMasterList';
import { DeleteConfirmDialog as DeckMasterDeleteConfirmDialog } from '../components/deck-master/DeleteConfirmDialog';
import { DeleteConfirmDialog as MyDeckDeleteConfirmDialog } from '../components/my-deck/DeleteConfirmDialog';
import type { CreateMyDeckInput } from '../components/my-deck/MyDeckDialog';
import { MyDeckDialog } from '../components/my-deck/MyDeckDialog';
import { MyDeckList } from '../components/my-deck/MyDeckList';
import { useDeckStore } from '../store/deckStore';
import type { DeckMasterWithUsage, MyDeck } from '../types';

/**
 * 【型定義】: タブ種別
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
type TabType = 'deckMaster' | 'myDeck';

/**
 * 【定数】: タブ定義
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
const DECK_MANAGE_TABS: Tab[] = [
  { id: 'deckMaster', label: 'デッキ種別' },
  { id: 'myDeck', label: '使用デッキ' },
];

/**
 * 【定数】: 有効なタブIDセット
 * タブID検証に使用（W-002対応）
 */
const VALID_TAB_IDS = new Set<TabType>(DECK_MANAGE_TABS.map((tab) => tab.id as TabType));

/**
 * 【機能概要】: デッキ管理ページコンポーネント
 * 【実装方針】: useState でタブ状態を管理し、汎用Tabsコンポーネントで表示を切り替え
 * 🔵 信頼性レベル: TASK-0022仕様に準拠
 */
export const DeckManagePage = () => {
  // 【State管理】: アクティブなタブ（初期値はデッキ種別）
  const [activeTab, setActiveTab] = useState<TabType>('deckMaster');

  // 【Deck Store】: デッキ管理用の状態と操作
  const {
    deckMasters,
    deckMastersWithUsage,
    myDecks,
    isLoadingDeckMasters,
    isMyDecksLoading,
    deckMasterError,
    myDecksError,
    fetchDeckMasters,
    fetchDeckMastersWithUsage,
    fetchMyDecks,
    addDeckMaster,
    updateDeckMaster,
    deleteDeckMaster,
    addMyDeck,
    deleteMyDeck,
  } = useDeckStore();

  // 【初期化処理】: ページマウント時にデータを取得
  useEffect(() => {
    fetchDeckMastersWithUsage(true);
    fetchMyDecks();
  }, [fetchDeckMastersWithUsage, fetchMyDecks]);

  // ==================== DeckMaster ダイアログ状態 ====================

  // 【State】: デッキマスター追加/編集ダイアログ
  const [isDeckMasterDialogOpen, setIsDeckMasterDialogOpen] = useState(false);
  const [deckMasterDialogMode, setDeckMasterDialogMode] = useState<'create' | 'edit'>('create');
  const [editingDeckMaster, setEditingDeckMaster] = useState<DeckMasterWithUsage | undefined>(
    undefined
  );
  const [isDeckMasterSubmitting, setIsDeckMasterSubmitting] = useState(false);
  const [deckMasterDialogError, setDeckMasterDialogError] = useState<string | undefined>(undefined);

  // 【State】: デッキマスター削除確認ダイアログ
  const [isDeckMasterDeleteDialogOpen, setIsDeckMasterDeleteDialogOpen] = useState(false);
  const [deletingDeckMaster, setDeletingDeckMaster] = useState<DeckMasterWithUsage | null>(null);

  // ==================== MyDeck ダイアログ状態 ====================

  // 【State】: マイデッキ追加ダイアログ
  const [isMyDeckDialogOpen, setIsMyDeckDialogOpen] = useState(false);
  const [isMyDeckSubmitting, setIsMyDeckSubmitting] = useState(false);

  // 【State】: マイデッキ削除確認ダイアログ
  const [isMyDeckDeleteDialogOpen, setIsMyDeckDeleteDialogOpen] = useState(false);
  const [deletingMyDeck, setDeletingMyDeck] = useState<MyDeck | null>(null);

  // 【削除可能判定マップ】: マイデッキの削除可否を判定（useMemoでメモ化）
  const canDeleteMap = useMemo<Record<string, boolean>>(() => {
    return myDecks.reduce(
      (acc, deck) => {
        // 全てのデッキは削除可能
        acc[deck.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }, [myDecks]);

  // ==================== DeckMaster ハンドラ ====================

  // 【DeckMaster操作ハンドラ】: 新規追加
  const handleDeckMasterAdd = useCallback(() => {
    setDeckMasterDialogMode('create');
    setEditingDeckMaster(undefined);
    setDeckMasterDialogError(undefined);
    setIsDeckMasterDialogOpen(true);
  }, []);

  // 【DeckMaster操作ハンドラ】: 編集
  const handleDeckMasterEdit = useCallback((deckMaster: DeckMasterWithUsage) => {
    setDeckMasterDialogMode('edit');
    setEditingDeckMaster(deckMaster);
    setDeckMasterDialogError(undefined);
    setIsDeckMasterDialogOpen(true);
  }, []);

  // 【DeckMaster操作ハンドラ】: 削除確認ダイアログを開く
  const handleDeckMasterDelete = useCallback(
    (id: string) => {
      const deckMaster = deckMastersWithUsage.find((dm) => dm.id === id);
      if (deckMaster) {
        setDeletingDeckMaster(deckMaster);
        setIsDeckMasterDeleteDialogOpen(true);
      }
    },
    [deckMastersWithUsage]
  );

  // 【DeckMaster操作ハンドラ】: ダイアログを閉じる
  const handleDeckMasterDialogClose = useCallback(() => {
    setIsDeckMasterDialogOpen(false);
    setEditingDeckMaster(undefined);
    setDeckMasterDialogError(undefined);
  }, []);

  // 【DeckMaster操作ハンドラ】: 送信処理
  const handleDeckMasterSubmit = useCallback(
    async (data: { className: string; deckName: string }) => {
      setIsDeckMasterSubmitting(true);
      setDeckMasterDialogError(undefined);

      try {
        if (deckMasterDialogMode === 'create') {
          await addDeckMaster(data);
        } else if (editingDeckMaster) {
          await updateDeckMaster(editingDeckMaster.id, { deckName: data.deckName });
        }
        handleDeckMasterDialogClose();
      } catch (err) {
        setDeckMasterDialogError(
          err instanceof Error ? err.message : 'エラーが発生しました。もう一度お試しください。'
        );
      } finally {
        setIsDeckMasterSubmitting(false);
      }
    },
    [
      deckMasterDialogMode,
      editingDeckMaster,
      addDeckMaster,
      updateDeckMaster,
      handleDeckMasterDialogClose,
    ]
  );

  // 【DeckMaster操作ハンドラ】: 削除確定
  const handleDeckMasterDeleteConfirm = useCallback(async () => {
    if (!deletingDeckMaster) return;

    try {
      await deleteDeckMaster(deletingDeckMaster.id);
      setIsDeckMasterDeleteDialogOpen(false);
      setDeletingDeckMaster(null);
    } catch {
      // エラーはStoreで管理される
    }
  }, [deletingDeckMaster, deleteDeckMaster]);

  // 【DeckMaster操作ハンドラ】: 削除キャンセル
  const handleDeckMasterDeleteCancel = useCallback(() => {
    setIsDeckMasterDeleteDialogOpen(false);
    setDeletingDeckMaster(null);
  }, []);

  // ==================== MyDeck ハンドラ ====================

  // 【MyDeck操作ハンドラ】: 新規追加
  const handleMyDeckAdd = useCallback(() => {
    // デッキマスター一覧を取得してからダイアログを開く
    fetchDeckMasters();
    setIsMyDeckDialogOpen(true);
  }, [fetchDeckMasters]);

  // 【MyDeck操作ハンドラ】: 削除確認ダイアログを開く
  const handleMyDeckDelete = useCallback(
    (id: string) => {
      const myDeck = myDecks.find((md) => md.id === id);
      if (myDeck) {
        setDeletingMyDeck(myDeck);
        setIsMyDeckDeleteDialogOpen(true);
      }
    },
    [myDecks]
  );

  // 【MyDeck操作ハンドラ】: ダイアログを閉じる
  const handleMyDeckDialogClose = useCallback(() => {
    setIsMyDeckDialogOpen(false);
  }, []);

  // 【MyDeck操作ハンドラ】: 送信処理
  const handleMyDeckSubmit = useCallback(
    async (input: CreateMyDeckInput) => {
      setIsMyDeckSubmitting(true);

      try {
        await addMyDeck({
          deckId: input.deckId,
          deckName: input.deckName,
          deckCode: input.deckCode,
        });
        handleMyDeckDialogClose();
      } catch {
        // エラーはStoreで管理される
      } finally {
        setIsMyDeckSubmitting(false);
      }
    },
    [addMyDeck, handleMyDeckDialogClose]
  );

  // 【MyDeck操作ハンドラ】: 削除確定
  const handleMyDeckDeleteConfirm = useCallback(async () => {
    if (!deletingMyDeck) return;

    try {
      await deleteMyDeck(deletingMyDeck.id);
      setIsMyDeckDeleteDialogOpen(false);
      setDeletingMyDeck(null);
    } catch {
      // エラーはStoreで管理される
    }
  }, [deletingMyDeck, deleteMyDeck]);

  // 【MyDeck操作ハンドラ】: 削除キャンセル
  const handleMyDeckDeleteCancel = useCallback(() => {
    setIsMyDeckDeleteDialogOpen(false);
    setDeletingMyDeck(null);
  }, []);

  // ==================== タブ切り替え ====================

  // 【タブ切り替えハンドラ】: タブID検証付き（W-002対応）
  const handleTabChange = (tabId: string) => {
    if (VALID_TAB_IDS.has(tabId as TabType)) {
      setActiveTab(tabId as TabType);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6" data-testid="deck-manage-page">
      {/* 【ページタイトル】 */}
      <h1 className="text-2xl font-bold mb-6" data-testid="deck-manage-title">
        デッキ管理
      </h1>

      {/* 【タブナビゲーションとコンテンツ】: 汎用Tabsコンポーネントを使用 */}
      <Tabs tabs={DECK_MANAGE_TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {/* 【タブコンテンツ】: アクティブタブに応じたコンポーネント表示 */}
        {activeTab === 'deckMaster' && (
          <DeckMasterList
            deckMasters={deckMastersWithUsage}
            isLoading={isLoadingDeckMasters}
            error={deckMasterError}
            onAdd={handleDeckMasterAdd}
            onEdit={handleDeckMasterEdit}
            onDelete={handleDeckMasterDelete}
          />
        )}
        {activeTab === 'myDeck' && (
          <MyDeckList
            myDecks={myDecks}
            isLoading={isMyDecksLoading}
            error={myDecksError}
            canDeleteMap={canDeleteMap}
            onAddClick={handleMyDeckAdd}
            onDeleteClick={handleMyDeckDelete}
          />
        )}
      </Tabs>

      {/* ==================== DeckMaster ダイアログ ==================== */}

      {/* 【デッキマスター追加/編集ダイアログ】 */}
      <DeckMasterDialog
        isOpen={isDeckMasterDialogOpen}
        mode={deckMasterDialogMode}
        initialData={editingDeckMaster}
        onClose={handleDeckMasterDialogClose}
        onSubmit={handleDeckMasterSubmit}
        isSubmitting={isDeckMasterSubmitting}
        error={deckMasterDialogError}
      />

      {/* 【デッキマスター削除確認ダイアログ】 */}
      <DeckMasterDeleteConfirmDialog
        isOpen={isDeckMasterDeleteDialogOpen}
        target={deletingDeckMaster}
        onConfirm={handleDeckMasterDeleteConfirm}
        onCancel={handleDeckMasterDeleteCancel}
      />

      {/* ==================== MyDeck ダイアログ ==================== */}

      {/* 【マイデッキ追加ダイアログ】 */}
      <MyDeckDialog
        isOpen={isMyDeckDialogOpen}
        deckMasters={deckMasters}
        isSubmitting={isMyDeckSubmitting}
        onClose={handleMyDeckDialogClose}
        onSubmit={handleMyDeckSubmit}
      />

      {/* 【マイデッキ削除確認ダイアログ】 */}
      <MyDeckDeleteConfirmDialog
        isOpen={isMyDeckDeleteDialogOpen}
        target={deletingMyDeck}
        onConfirm={handleMyDeckDeleteConfirm}
        onCancel={handleMyDeckDeleteCancel}
      />
    </div>
  );
};
