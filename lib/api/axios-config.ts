import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.ruyuan.live/game/uaa'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the JWT token from NextAuth session
    if (typeof window !== 'undefined') {
      const session = await getSession()
      const jwt = (session as any)?.jwt
      if (jwt) {
        config.headers.Authorization = `Bearer ${jwt}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
