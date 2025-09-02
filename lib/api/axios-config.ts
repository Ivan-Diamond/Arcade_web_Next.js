import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://206.81.25.143:9991/uaa'

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
      console.log('Axios interceptor - full session:', session)
      const jwt = (session as any)?.jwt
      const accessToken = (session as any)?.accessToken
      const token = jwt || accessToken
      console.log('Axios interceptor - token found:', !!token)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Axios interceptor - Authorization header set')
      } else {
        console.log('Axios interceptor - No token found in session')
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
      // Only redirect to login for certain endpoints, not all 401s
      const url = error.config?.url || ''
      const shouldRedirect = !url.includes('getGameRecordList') && !url.includes('profile')
      
      if (shouldRedirect && typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
