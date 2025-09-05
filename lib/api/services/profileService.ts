import { ProfileStatsResponse, ChangeUsernameResponse, UpgradeAccountResponse, UpgradeAccountRequest, ChangePasswordRequest, ChangePasswordResponse } from '@/lib/types/profile'
import { ApiResponse } from '@/lib/types'

const getProfileStats = async (): Promise<ProfileStatsResponse> => {
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

const changeUsername = async (newUsername: string): Promise<ChangeUsernameResponse> => {
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

const upgradeAccount = async (request: UpgradeAccountRequest): Promise<UpgradeAccountResponse> => {
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

const changePassword = async (request: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    const response = await fetch('/app/api/profile/change-password', {
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
        error: data.error || 'Failed to change password'
      }
    }

    return data
  } catch (error) {
    console.error('Error changing password:', error)
    return {
      success: false,
      error: 'Failed to change password'
    }
  }
}

const updateAvatar = async (avatar: string): Promise<ApiResponse<{ avatar: string }>> => {
  try {
    const response = await fetch('/app/api/profile/update-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update avatar'
      }
    }

    // Note: NextAuth session update will be handled in the component

    return {
      success: true,
      data: { avatar: data.data?.avatar || avatar }
    }
  } catch (error) {
    console.error('Avatar update error:', error)
    return {
      success: false,
      error: 'Network error occurred'
    }
  }
}

export const profileService = {
  getProfileStats,
  changeUsername,
  changePassword,
  upgradeAccount,
  updateAvatar
}
