// User Types
export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  coins: number
  wins: number
  gamesPlayed: number
  winRate: number
  createdAt: Date
  updatedAt: Date
}

// Game Room Types
export interface GameRoom {
  id: string
  name: string
  description?: string
  status: 'available' | 'occupied' | 'maintenance'
  streamUrl: string
  thumbnailUrl?: string
  currentPlayer?: string
  queueLength: number
  difficulty: 'easy' | 'medium' | 'hard'
  coinCost: number
  coinReward: number
}

// Game Session Types
export interface GameSession {
  id: string
  roomId: string
  userId: string
  startTime: Date
  endTime?: Date
  duration: number
  result: 'win' | 'lose' | 'timeout' | 'pending'
  coinsSpent: number
  coinsEarned: number
}

// Auth Types
export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  email?: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// WebSocket Types
export interface GameCommand {
  type: 'move' | 'grab' | 'release' | 'stop'
  direction?: 'up' | 'down' | 'left' | 'right'
  timestamp: number
}

export interface GameState {
  roomId: string
  isPlaying: boolean
  timeRemaining: number
  coinsInserted: number
  position: {
    x: number
    y: number
    z: number
  }
}

// Game Record Types
export interface GameRecord {
  id: string
  userId: string
  macNo: string
  machineName: string
  result: 'win' | 'lose' | 'timeout' | 'pending'
  coinsSpent: number
  coinsEarned: number
  startTime: string
  endTime: string
  duration: number
  createdAt: string
}

export interface GameHistoryResponse {
  records: GameRecord[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasMore: boolean
  }
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  wins: number
  coins: number
  winRate: number
}
