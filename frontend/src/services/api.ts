import type { BattleLog, CreateBattleLogRequest, DeckMaster, MyDeck } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const API_KEY = import.meta.env.FUNCTIONS_API_KEY  || ''

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-functions-key': API_KEY,
        ...options?.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Battle Logs
  async getBattleLogs(): Promise<BattleLog[]> {
    return this.request<BattleLog[]>('/battle-logs')
  }

  async getBattleLog(id: string): Promise<BattleLog> {
    return this.request<BattleLog>(`/battle-logs/${id}`)
  }

  async createBattleLog(data: CreateBattleLogRequest): Promise<BattleLog> {
    return this.request<BattleLog>('/battle-logs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateBattleLog(id: string, data: Partial<CreateBattleLogRequest>): Promise<BattleLog> {
    return this.request<BattleLog>(`/battle-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteBattleLog(id: string): Promise<void> {
    await this.request(`/battle-logs/${id}`, {
      method: 'DELETE'
    })
  }

  // Master Data
  async getDeckMaster(): Promise<DeckMaster[]> {
    return this.request<DeckMaster[]>('/master/decks')
  }

  async getMyDecks(): Promise<MyDeck[]> {
    return this.request<MyDeck[]>('/master/my-decks')
  }

  // Export
  async exportCSV(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/export/csv`)
    if (!response.ok) {
      throw new Error('Failed to export CSV')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `battle-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}

export const api = new ApiService()