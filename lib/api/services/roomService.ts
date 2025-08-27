import axiosInstance from '../axios-config'
import { GameRoom, ApiResponse } from '@/lib/types'

export const roomService = {
  async getAllRooms(): Promise<ApiResponse<GameRoom[]>> {
    const response = await axiosInstance.get('/rooms')
    return response.data
  },

  async getRoom(roomId: string): Promise<ApiResponse<GameRoom>> {
    const response = await axiosInstance.get(`/rooms/${roomId}`)
    return response.data
  },

  async joinRoom(roomId: string): Promise<ApiResponse<{ token: string; streamUrl: string }>> {
    const response = await axiosInstance.post(`/rooms/${roomId}/join`)
    return response.data
  },

  async leaveRoom(roomId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post(`/rooms/${roomId}/leave`)
    return response.data
  },

  async getQueuePosition(roomId: string): Promise<ApiResponse<{ position: number; estimatedWait: number }>> {
    const response = await axiosInstance.get(`/rooms/${roomId}/queue`)
    return response.data
  },
}
