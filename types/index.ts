export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  id: string
  username: string
  email: string
  coins: number
  level: number
  gamesPlayed: number
  createdAt?: string
  updatedAt?: string
}

export interface Room {
  id: string
  name: string
  type: 'claw' | 'arcade'
  status: 'available' | 'occupied' | 'maintenance'
  currentPlayer?: string
  queuedPlayers: string[]
  thumbnail: string
  price: number
  description?: string
}

export interface GameSession {
  id: string
  roomId: string
  userId: string
  startTime: string
  endTime?: string
  score: number
  coinsWon: number
  status: 'active' | 'completed' | 'failed'
}

export interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  coins: number
  gamesPlayed: number
  winRate: number
}
