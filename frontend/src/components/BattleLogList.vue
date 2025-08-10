<template>
  <div class="battle-log-list">
    <div class="list-header">
      <h2>対戦履歴</h2>
      <div class="header-buttons">
        <button @click="exportCSV" class="btn btn-secondary">
          CSV出力
        </button>
        <button @click="emit('add')" class="btn btn-primary">
          新規登録
        </button>
      </div>
    </div>

    <div v-if="battleLogStore.loading" class="loading">
      読み込み中...
    </div>

    <div v-else-if="battleLogStore.error" class="error">
      {{ battleLogStore.error }}
    </div>

    <div v-else-if="battleLogStore.battleLogs.length === 0" class="empty">
      対戦履歴がありません
    </div>

    <div v-else class="battle-log-table">
      <div class="table-header">
        <div class="col-date">日付</div>
        <div class="col-type">対戦種別</div>
        <div class="col-rank">ランク/グループ</div>
        <div class="col-turn">先攻/後攻</div>
        <div class="col-my-deck">自分デッキ</div>
        <div class="col-opponent-deck">相手デッキ</div>
        <div class="col-result">勝敗</div>
        <div class="col-actions">操作</div>
      </div>

      <div
        v-for="log in battleLogStore.battleLogs"
        :key="log.id"
        class="table-row"
      >
        <div class="col-date">
          {{ formatDate(log.date) }}
        </div>
        <div class="col-type">
          {{ log.battleType }}
        </div>
        <div class="col-rank">
          <div v-if="log.rank">{{ log.rank }}</div>
          <div v-if="log.group" class="group">{{ log.group }}</div>
        </div>
        <div class="col-turn">
          {{ log.turn }}
        </div>
        <div class="col-my-deck">
          {{ battleLogStore.getMyDeckName(log.myDeckId) }}
        </div>
        <div class="col-opponent-deck">
          {{ battleLogStore.getDeckName(log.opponentDeckId) }}
        </div>
        <div class="col-result">
          <span :class="['result', log.result.toLowerCase()]">
            {{ log.result }}
          </span>
        </div>
        <div class="col-actions">
          <button @click="deleteLog(log.id)" class="btn btn-danger btn-sm">
            削除
          </button>
        </div>
      </div>
    </div>

    <div v-if="!battleLogStore.loading && battleLogStore.battleLogs.length > 0" class="summary">
      表示件数: {{ battleLogStore.battleLogs.length }}件 (直近1週間)
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBattleLogStore } from '@/stores/battleLog'
import { api } from '@/services/api'

const emit = defineEmits<{
  add: []
}>()

const battleLogStore = useBattleLogStore()

onMounted(async () => {
  await Promise.all([
    battleLogStore.fetchBattleLogs(),
    battleLogStore.fetchMasterData()
  ])
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  })
}

async function deleteLog(id: string) {
  if (confirm('この対戦履歴を削除しますか？')) {
    try {
      await battleLogStore.deleteBattleLog(id)
    } catch (error) {
      alert('削除に失敗しました')
    }
  }
}

async function exportCSV() {
  try {
    await api.exportCSV()
  } catch (error) {
    alert('CSV出力に失敗しました')
  }
}
</script>

<style scoped>
.battle-log-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.error {
  color: #dc2626;
}

.battle-log-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 80px 100px 120px 80px 1fr 1fr 60px 80px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: center;
}

.table-header {
  background-color: #f8fafc;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.table-row {
  border-bottom: 1px solid #f1f5f9;
}

.table-row:hover {
  background-color: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.col-rank .group {
  font-size: 0.75rem;
  color: #6b7280;
}

.result {
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.result.win {
  background-color: #dcfce7;
  color: #16a34a;
}

.result.lose {
  background-color: #fee2e2;
  color: #dc2626;
}

.summary {
  margin-top: 1rem;
  text-align: right;
  color: #6b7280;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .battle-log-list {
    padding: 0.5rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .table-row > div {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .table-row > div:last-child {
    border-bottom: none;
  }

  .table-row > div::before {
    content: attr(class);
    font-weight: 600;
    text-transform: capitalize;
  }

  .col-date::before { content: "日付: "; }
  .col-type::before { content: "対戦種別: "; }
  .col-rank::before { content: "ランク: "; }
  .col-turn::before { content: "先攻/後攻: "; }
  .col-my-deck::before { content: "自分デッキ: "; }
  .col-opponent-deck::before { content: "相手デッキ: "; }
  .col-result::before { content: "勝敗: "; }
  .col-actions::before { content: "操作: "; }
}
</style>