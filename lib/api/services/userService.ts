import axiosInstance from '../axios-config'
import { User, ApiResponse } from '@/lib/types'

export const userService = {
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await axiosInstance.get('/users/profile')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await axiosInstance.put('/users/profile', data)
    return response.data
  },

  async getLeaderboard(limit = 100): Promise<ApiResponse<User[]>> {
    const response = await axiosInstance.get(`/users/leaderboard?limit=${limit}`)
    return response.data
  },

  async getStats(userId: string): Promise<ApiResponse<any>> {
    const response = await axiosInstance.get(`/users/${userId}/stats`)
    return response.data
  },
}
