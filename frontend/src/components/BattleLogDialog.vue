<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <h2>対戦履歴登録</h2>
        <button class="close-button" @click="close">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="date">日付 *</label>
          <input
            id="date"
            v-model="formData.date"
            type="date"
            required
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="battleType">対戦種別</label>
          <select id="battleType" v-model="formData.battleType" class="form-control">
            <option value="ランクマッチ">ランクマッチ</option>
            <option value="対戦台">対戦台</option>
            <option value="2pick">2pick</option>
            <option value="ロビー大会">ロビー大会</option>
          </select>
        </div>

        <div class="form-group">
          <label for="rank">ランク</label>
          <select id="rank" v-model="formData.rank" class="form-control">
            <option value="">選択してください</option>
            <option value="C">C</option>
            <option value="B">B</option>
            <option value="A">A</option>
            <option value="AA">AA</option>
            <option value="Master">Master</option>
          </select>
        </div>

        <div class="form-group">
          <label for="group">グループ</label>
          <select id="group" v-model="formData.group" class="form-control">
            <option value="">選択してください</option>
            <option value="エメラルド">エメラルド</option>
            <option value="トパーズ">トパーズ</option>
            <option value="ルビー">ルビー</option>
            <option value="サファイア">サファイア</option>
            <option value="ダイアモンド">ダイアモンド</option>
          </select>
        </div>

        <div class="form-group">
          <label>先行・後攻</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="formData.turn" type="radio" value="先行">
              先行
            </label>
            <label class="radio-label">
              <input v-model="formData.turn" type="radio" value="後攻">
              後攻
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="myDeckId">自分デッキ *</label>
          <select id="myDeckId" v-model="formData.myDeckId" required class="form-control">
            <option value="">選択してください</option>
            <option
              v-for="deck in battleLogStore.myDecks"
              :key="deck.id"
              :value="deck.id"
            >
              {{ battleLogStore.getMyDeckName(deck.id) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="opponentDeckId">相手デッキ *</label>
          <select id="opponentDeckId" v-model="formData.opponentDeckId" required class="form-control">
            <option value="">選択してください</option>
            <option
              v-for="deck in battleLogStore.sortedDeckMaster"
              :key="deck.id"
              :value="deck.id"
            >
              {{ deck.className }} - {{ deck.deckName }}
            </option>
          </select>
          <div v-if="!formData.opponentDeckId && showError" class="error-message">
            相手デッキを選択してください
          </div>
        </div>

        <div class="form-group">
          <label>勝敗</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="formData.result" type="radio" value="WIN">
              WIN
            </label>
            <label class="radio-label">
              <input v-model="formData.result" type="radio" value="LOSE">
              LOSE
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="close" class="btn btn-secondary">
            キャンセル
          </button>
          <button type="submit" :disabled="battleLogStore.loading" class="btn btn-primary">
            {{ battleLogStore.loading ? '登録中...' : '登録' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useBattleLogStore } from '@/stores/battleLog'
import type { CreateBattleLogRequest } from '@/types'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: []
}>()

const battleLogStore = useBattleLogStore()
const showError = ref(false)

const formData = reactive<CreateBattleLogRequest>({
  date: new Date().toISOString().split('T')[0],
  battleType: 'ランクマッチ',
  turn: '先行',
  myDeckId: '',
  opponentDeckId: '',
  result: 'WIN'
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    showError.value = false
    // Load previous selections from localStorage or set defaults
    const saved = localStorage.getItem('lastBattleLog')
    if (saved) {
      const lastData = JSON.parse(saved)
      formData.battleType = lastData.battleType || 'ランクマッチ'
      formData.rank = lastData.rank
      formData.group = lastData.group
      formData.myDeckId = lastData.myDeckId || ''
    }
  }
})

function close() {
  emit('close')
}

function handleOverlayClick() {
  close()
}

async function handleSubmit() {
  showError.value = false
  
  if (!formData.opponentDeckId) {
    showError.value = true
    return
  }

  try {
    await battleLogStore.createBattleLog(formData)
    
    // Save current selections for next time
    localStorage.setItem('lastBattleLog', JSON.stringify({
      battleType: formData.battleType,
      rank: formData.rank,
      group: formData.group,
      myDeckId: formData.myDeckId
    }))
    
    // Reset form
    formData.date = new Date().toISOString().split('T')[0]
    formData.opponentDeckId = ''
    formData.result = 'WIN'
    formData.turn = '先行'
    
    emit('submit')
    close()
  } catch (error) {
    console.error('Failed to create battle log:', error)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: #f1f5f9;
  border-radius: 4px;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  margin: 0;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}
</style>