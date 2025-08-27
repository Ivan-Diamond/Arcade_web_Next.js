import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  currentRoom: string | null
  gameState: 'waiting' | 'playing' | 'ended'
  timeLeft: number
  score: number
  coinsWon: number
  isHost: boolean
  sessionId: string | null
}

interface GameStore extends GameState {
  // Actions
  setCurrentRoom: (roomId: string | null) => void
  setGameState: (state: GameState['gameState']) => void
  setTimeLeft: (time: number) => void
  setScore: (score: number) => void
  setCoinsWon: (coins: number) => void
  setIsHost: (isHost: boolean) => void
  setSessionId: (sessionId: string | null) => void
  resetGame: () => void
  incrementScore: (points: number) => void
  decrementTime: () => void
}

const initialState: GameState = {
  currentRoom: null,
  gameState: 'waiting',
  timeLeft: 60,
  score: 0,
  coinsWon: 0,
  isHost: false,
  sessionId: null
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
      setGameState: (gameState) => set({ gameState }),
      setTimeLeft: (timeLeft) => set({ timeLeft }),
      setScore: (score) => set({ score }),
      setCoinsWon: (coinsWon) => set({ coinsWon }),
      setIsHost: (isHost) => set({ isHost }),
      setSessionId: (sessionId) => set({ sessionId }),
      
      resetGame: () => set(initialState),
      
      incrementScore: (points) => set((state) => ({ 
        score: state.score + points 
      })),
      
      decrementTime: () => set((state) => ({ 
        timeLeft: Math.max(0, state.timeLeft - 1) 
      }))
    }),
    {
      name: 'game-store',
      partialize: (state) => ({
        score: state.score,
        coinsWon: state.coinsWon
      })
    }
  )
)
