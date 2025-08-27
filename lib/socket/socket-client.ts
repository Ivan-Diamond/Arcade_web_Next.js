import { io, Socket } from 'socket.io-client'
import { GameCommand, GameState } from '@/lib/types'
import { useGameStore } from '@/lib/stores/useGameStore'

export class SocketManager {
  private socket: Socket | null = null
  private connected: boolean = false
  private roomId: string | null = null

  connect(url: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://206.81.25.143:59199/ws') {
    if (this.socket?.connected) return

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      path: '/ws',
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to game server')
      this.connected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server')
      this.connected = false
    })

    this.socket.on('game:state', (state: GameState) => {
      useGameStore.getState().updateGameState(state)
    })

    this.socket.on('game:end', (result: { winner: boolean; coinsEarned: number }) => {
      useGameStore.getState().endSession(result.winner ? 'win' : 'lose')
    })

    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error)
    })
  }

  joinGameRoom(roomId: string, token: string) {
    if (!this.socket) return

    this.roomId = roomId
    this.socket.emit('room:join', { roomId, token })
  }

  leaveGameRoom() {
    if (!this.socket || !this.roomId) return

    this.socket.emit('room:leave', { roomId: this.roomId })
    this.roomId = null
  }

  sendCommand(command: GameCommand) {
    if (!this.socket || !this.roomId) return

    this.socket.emit('game:command', {
      roomId: this.roomId,
      command,
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}

// Export singleton instance
export const socketClient = new SocketManager()
export default SocketManager
