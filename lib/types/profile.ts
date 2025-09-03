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
    username: string
    jwt: string
  }
  message?: string
  error?: string
}

export interface UpgradeAccountRequest {
  newUsername: string
  newPassword: string
  newEmail?: string
}

export interface UpgradeAccountResponse {
  success: boolean
  data?: {
    username: string
    jwt: string
  }
  message?: string
  error?: string
}
