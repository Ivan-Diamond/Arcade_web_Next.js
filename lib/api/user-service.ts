const API_URL = 'http://206.81.25.143:9991'

export const userService = {
  async getUserInfo(token: string) {
    const response = await fetch(`${API_URL}/uaa/v1/getCustomerInfo`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info')
    }

    return response.json()
  },
  
  async refreshUserData(jwt: string) {
    try {
      const response = await fetch('/api/user/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh user data')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error refreshing user data:', error)
      return { success: false }
    }
  },
}
