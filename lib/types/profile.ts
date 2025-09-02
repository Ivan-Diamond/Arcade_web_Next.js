export interface ProfileStats {
  totalGames: number
  totalWins: number
  totalLosses: number
  winRate: number // percentage
  totalCoinsSpent: number
  totalCoinsEarned: number
  netCoins: number
}

export interface ProfileStatsResponse {
  success: boolean
  data?: ProfileStats
  error?: string
}

export interface ChangeUsernameRequest {
  newUsername: string
}

export interface ChangeUsernameResponse {
  success: boolean
  data?: {
    newUsername: string
    message: string
  }
  error?: string
}
