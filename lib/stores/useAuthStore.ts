import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginCredentials, RegisterData } from '@/lib/types'
import toast from 'react-hot-toast'
import { signIn, signOut, getSession } from 'next-auth/react'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  checkAuth: () => Promise<void>
  syncWithSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const result = await signIn('credentials', {
            username: credentials.username,
            password: credentials.password,
            redirect: false,
          })

          if (result?.error) {
            throw new Error(result.error)
          }

          // Sync with session after login
          await get().syncWithSession()
          
          toast.success('Login successful!')
        } catch (error) {
          set({ isLoading: false })
          toast.error('Login failed')
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          // TODO: Implement actual API call
          // const response = await authService.register(data)
          
          toast.success('Registration successful! Please login.')
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          toast.error('Registration failed')
          throw error
        }
      },

      logout: async () => {
        await signOut({ redirect: false })
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        toast.success('Logged out successfully')
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          })
        }
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          // TODO: Validate token with API
          // const response = await authService.validateToken(token)
          set({ isAuthenticated: true })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      syncWithSession: async () => {
        try {
          const session = await getSession()
          if (session?.user) {
            const user: User = {
              id: session.user.id || '',
              username: session.user.username || session.user.name || '',
              coins: (session.user as any).coins || 0,
              wins: 0,
              gamesPlayed: 0,
              winRate: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            set({
              user,
              token: (session as any).jwt || null,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Failed to sync with session:', error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
