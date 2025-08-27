import { apiClient } from './client'
import { ApiResponse } from '@/types'

export interface GameSession {
  id: string
  roomId: string
  userId: string
  startTime: string
  endTime?: string
  score: number
  coinsWon: number
  status: 'active' | 'completed' | 'failed'
  moves: GameMove[]
}

export interface GameMove {
  timestamp: string
  direction: 'up' | 'down' | 'left' | 'right' | 'grab' | 'release'
  x: number
  y: number
  z: number
}

export interface GameResult {
  sessionId: string
  score: number
  coinsWon: number
  itemsWon: string[]
  duration: number
  success: boolean
}

export interface GameStats {
  totalGames: number
  totalWins: number
  totalCoins: number
  winRate: number
  averageScore: number
  bestScore: number
  lastPlayed?: string
}

class GameService {
  // Start a new game session
  async startGame(roomId: string): Promise<ApiResponse<GameSession>> {
    try {
      const response = await apiClient.post(`/api/games/start`, { roomId })
      return response.data
    } catch (error) {
      console.error('Error starting game:', error)
      throw error
    }
  }

  // End game session and calculate results
  async endGame(sessionId: string): Promise<ApiResponse<GameResult>> {
    try {
      const response = await apiClient.post(`/api/games/${sessionId}/end`)
      return response.data
    } catch (error) {
      console.error('Error ending game:', error)
      throw error
    }
  }

  // Record a game move
  async recordMove(sessionId: string, move: Omit<GameMove, 'timestamp'>): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post(`/api/games/${sessionId}/moves`, {
        ...move,
        timestamp: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Error recording move:', error)
      throw error
    }
  }

  // Get game session details
  async getGameSession(sessionId: string): Promise<ApiResponse<GameSession>> {
    try {
      const response = await apiClient.get(`/api/games/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error getting game session:', error)
      throw error
    }
  }

  // Get user's game history
  async getUserGameHistory(userId: string, limit: number = 10): Promise<ApiResponse<GameSession[]>> {
    try {
      const response = await apiClient.get(`/api/games/history/${userId}`, {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Error getting game history:', error)
      throw error
    }
  }

  // Get user's game statistics
  async getUserStats(userId: string): Promise<ApiResponse<GameStats>> {
    try {
      const response = await apiClient.get(`/api/games/stats/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  // Get global leaderboard
  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all' = 'all', limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/api/games/leaderboard', {
        params: { timeframe, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      throw error
    }
  }

  // Claim prize/reward after winning
  async claimPrize(sessionId: string): Promise<ApiResponse<{ coins: number, items: string[] }>> {
    try {
      const response = await apiClient.post(`/api/games/${sessionId}/claim`)
      return response.data
    } catch (error) {
      console.error('Error claiming prize:', error)
      throw error
    }
  }

  // Mock methods for demo without backend
  async mockStartGame(roomId: string): Promise<GameSession> {
    return {
      id: `game_${Date.now()}`,
      roomId,
      userId: 'user_123',
      startTime: new Date().toISOString(),
      score: 0,
      coinsWon: 0,
      status: 'active',
      moves: []
    }
  }

  async mockEndGame(sessionId: string): Promise<GameResult> {
    const won = Math.random() > 0.5
    return {
      sessionId,
      score: Math.floor(Math.random() * 1000),
      coinsWon: won ? Math.floor(Math.random() * 50) + 10 : 0,
      itemsWon: won ? ['Plush Toy'] : [],
      duration: 60,
      success: won
    }
  }

  async mockGetUserStats(userId: string): Promise<GameStats> {
    return {
      totalGames: Math.floor(Math.random() * 100),
      totalWins: Math.floor(Math.random() * 50),
      totalCoins: Math.floor(Math.random() * 1000),
      winRate: Math.random() * 0.5 + 0.2,
      averageScore: Math.floor(Math.random() * 500) + 200,
      bestScore: Math.floor(Math.random() * 1000) + 500,
      lastPlayed: new Date().toISOString()
    }
  }

  async mockGetLeaderboard(): Promise<any[]> {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      username: `Player${i + 1}`,
      score: Math.floor(Math.random() * 1000) + (10 - i) * 100,
      coins: Math.floor(Math.random() * 500) + (10 - i) * 50,
      gamesPlayed: Math.floor(Math.random() * 100),
      winRate: Math.random() * 0.5 + 0.2
    })).sort((a, b) => b.score - a.score)
  }
}

export const gameService = new GameService()
export default gameService
