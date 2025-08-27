import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string
  coins: number
  level: number
  gamesPlayed: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  login: (user: User) => void
  logout: () => void
  updateCoins: (coins: number) => void
  incrementGamesPlayed: () => void
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setIsLoading: (isLoading) => set({ isLoading }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true,
        isLoading: false
      }),
      
      logout: () => set(initialState),
      
      updateCoins: (coins) => set((state) => ({
        user: state.user ? { ...state.user, coins } : null
      })),
      
      incrementGamesPlayed: () => set((state) => ({
        user: state.user 
          ? { ...state.user, gamesPlayed: state.user.gamesPlayed + 1 }
          : null
      }))
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
