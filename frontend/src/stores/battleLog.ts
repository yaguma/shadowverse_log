import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { BattleLog, CreateBattleLogRequest, DeckMaster, MyDeck } from '@/types'

export const useBattleLogStore = defineStore('battleLog', () => {
  // State
  const battleLogs = ref<BattleLog[]>([])
  const deckMaster = ref<DeckMaster[]>([])
  const myDecks = ref<MyDeck[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sortedDeckMaster = computed(() =>
    deckMaster.value.sort((a, b) => a.sortOrder - b.sortOrder)
  )

  // Actions
  async function fetchBattleLogs() {
    loading.value = true
    error.value = null
    try {
      battleLogs.value = await api.getBattleLogs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch battle logs'
    } finally {
      loading.value = false
    }
  }

  async function fetchMasterData() {
    try {
      const [deckData, myDeckData] = await Promise.all([
        api.getDeckMaster(),
        api.getMyDecks()
      ])
      deckMaster.value = deckData
      myDecks.value = myDeckData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch master data'
    }
  }

  async function createBattleLog(data: CreateBattleLogRequest) {
    loading.value = true
    error.value = null
    try {
      const newLog = await api.createBattleLog(data)
      battleLogs.value.unshift(newLog) // Add to beginning of array
      return newLog
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create battle log'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBattleLog(id: string) {
    try {
      await api.deleteBattleLog(id)
      const index = battleLogs.value.findIndex(log => log.id === id)
      if (index !== -1) {
        battleLogs.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete battle log'
      throw err
    }
  }

  function getDeckName(deckId: string): string {
    const deck = deckMaster.value.find(d => d.id === deckId)
    return deck ? `${deck.className} - ${deck.deckName}` : 'Unknown Deck'
  }

  function getMyDeckName(myDeckId: string): string {
    const myDeck = myDecks.value.find(d => d.id === myDeckId)
    if (!myDeck) return 'Unknown Deck'
    
    const masterDeck = deckMaster.value.find(d => d.id === myDeck.deckId)
    return masterDeck ? `${masterDeck.className} - ${masterDeck.deckName}` : 'Unknown Deck'
  }

  return {
    // State
    battleLogs,
    deckMaster,
    myDecks,
    loading,
    error,
    
    // Getters
    sortedDeckMaster,
    
    // Actions
    fetchBattleLogs,
    fetchMasterData,
    createBattleLog,
    deleteBattleLog,
    getDeckName,
    getMyDeckName
  }
})