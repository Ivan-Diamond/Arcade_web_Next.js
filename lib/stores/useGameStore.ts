import { create } from 'zustand'
import { GameRoom, GameSession, GameState, GameCommand } from '@/lib/types'
import { amplitudeService } from '@/lib/analytics/amplitude'

interface GameStore {
  currentRoom: GameRoom | null
  currentSession: GameSession | null
  gameState: GameState | null
  isConnected: boolean
  stream: MediaStream | null
  
  // Actions
  joinRoom: (room: GameRoom) => void
  leaveRoom: () => void
  updateGameState: (state: Partial<GameState>) => void
  setStream: (stream: MediaStream | null) => void
  sendCommand: (command: GameCommand) => void
  endSession: (result: 'win' | 'lose' | 'timeout') => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentRoom: null,
  currentSession: null,
  gameState: null,
  isConnected: false,
  stream: null,

  joinRoom: (room) => {
    // Track game start event
    amplitudeService.trackGameStart(room.id, room.name, room.coinCost)
    
    set({
      currentRoom: room,
      isConnected: true,
      gameState: {
        roomId: room.id,
        isPlaying: true,
        timeRemaining: 60,
        coinsInserted: room.coinCost,
        position: { x: 0, y: 0, z: 0 },
      },
    })
  },

  leaveRoom: () => {
    const { stream } = get()
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    
    set({
      currentRoom: null,
      currentSession: null,
      gameState: null,
      isConnected: false,
      stream: null,
    })
  },

  updateGameState: (updates) => {
    const currentState = get().gameState
    if (currentState) {
      set({
        gameState: { ...currentState, ...updates }
      })
    }
  },

  setStream: (stream) => {
    set({ stream })
  },

  sendCommand: (command) => {
    // TODO: Send command via WebSocket
    console.log('Sending command:', command)
  },

  endSession: (result) => {
    const currentSession = get().currentSession
    const currentRoom = get().currentRoom
    const gameState = get().gameState
    
    if (currentSession && currentRoom) {
      const duration = currentSession.startTime ? 
        (new Date().getTime() - new Date(currentSession.startTime).getTime()) / 1000 : 0
      const coinsWon = result === 'win' ? currentRoom.coinReward : 0
      
      // Track game end event
      amplitudeService.trackGameEnd(currentRoom.id, result, coinsWon, duration)
      
      set({
        currentSession: {
          ...currentSession,
          result,
          endTime: new Date(),
        },
      })
    }
  },
}))
