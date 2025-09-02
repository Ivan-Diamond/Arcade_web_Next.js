import { GameHistoryResponse, ApiResponse } from '@/lib/types'

export const historyService = {
  async getGameHistory(page = 0, pageSize = 200): Promise<ApiResponse<GameHistoryResponse>> {
    try {
      console.log('Making API request to /app/api/history with params:', { page, pageSize })
      
      const response = await fetch(`/app/api/history?page=${page}&pageSize=${pageSize}`)
      const data = await response.json()
      
      console.log('History API response:', data)
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch game history'
        }
      }
      
      return data
    } catch (error: any) {
      console.error('History API error:', error)
      return {
        success: false,
        error: 'Failed to fetch game history'
      }
    }
  }
}
