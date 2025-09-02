import { ProfileStatsResponse } from '@/lib/types/profile'

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
}

export const profileService = new ProfileService()
