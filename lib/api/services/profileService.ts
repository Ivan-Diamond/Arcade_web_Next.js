import { ProfileStatsResponse, ChangeUsernameResponse, UpgradeAccountResponse, UpgradeAccountRequest } from '@/lib/types/profile'

class ProfileService {
  async getProfileStats(): Promise<ProfileStatsResponse> {
    try {
      const response = await fetch('/app/api/profile/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching profile stats:', error)
      return {
        success: false,
        error: 'Failed to fetch profile statistics'
      }
    }
  }

  async changeUsername(newUsername: string): Promise<ChangeUsernameResponse> {
    try {
      const response = await fetch('/app/api/profile/change-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUsername }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to change username'
        }
      }

      return data
    } catch (error) {
      console.error('Error changing username:', error)
      return {
        success: false,
        error: 'Failed to change username'
      }
    }
  }

  async upgradeAccount(request: UpgradeAccountRequest): Promise<UpgradeAccountResponse> {
    try {
      const response = await fetch('/app/api/profile/upgrade-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upgrade account'
        }
      }

      return data
    } catch (error) {
      console.error('Error upgrading account:', error)
      return {
        success: false,
        error: 'Failed to upgrade account'
      }
    }
  }
}

export const profileService = new ProfileService()
