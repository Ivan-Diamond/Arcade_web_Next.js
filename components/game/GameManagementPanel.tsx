'use client'

import { Users, Timer, Play, UserPlus, UserMinus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export enum GameState {
  IDLE = 'idle',
  READY_PLAY = 'readyPlay', 
  PLAYING = 'playing',
  OTHER_PLAYING = 'otherPlaying',
  IN_QUEUE = 'inQueue'
}

interface GameManagementPanelProps {
  gameState: GameState
  currentPlayerName: string | null
  currentPlayerId: number | null
  queuePosition: number
  queueSize: number
  timeRemaining: number
  isWaitingForServer: boolean
  errorMessage: string | null
  successMessage: string | null
  isConnected: boolean
  onStartGame: () => void
  onJoinQueue: () => void
  onLeaveQueue: () => void
}

export function GameManagementPanel({
  gameState,
  currentPlayerName,
  currentPlayerId,
  queuePosition,
  queueSize,
  timeRemaining,
  isWaitingForServer,
  errorMessage,
  successMessage,
  isConnected,
  onStartGame,
  onJoinQueue,
  onLeaveQueue
}: GameManagementPanelProps) {
  
  const renderGameStateContent = () => {
    switch (gameState) {
      case GameState.IDLE:
        return (
          <div className="space-y-4">
            {isWaitingForServer ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />
                <span className="text-neon-cyan">Starting game...</span>
              </div>
            ) : (
              <button
                onClick={onStartGame}
                disabled={!isConnected}
                className="btn-neon px-8 py-3 flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                Start Game
              </button>
            )}
          </div>
        )

      case GameState.OTHER_PLAYING:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Currently Playing</span>
              </div>
              <p className="text-white">
                {currentPlayerName || 'Someone'} is playing
              </p>
              {timeRemaining > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Timer className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">
                    {timeRemaining}s remaining
                  </span>
                </div>
              )}
            </div>
            
            {isWaitingForServer ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-neon-cyan" />
                <span className="text-neon-cyan">Joining queue...</span>
              </div>
            ) : (
              <button
                onClick={onJoinQueue}
                disabled={!isConnected}
                className="w-full btn-neon-secondary py-3 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Join Queue
              </button>
            )}
          </div>
        )

      case GameState.IN_QUEUE:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">In Queue</span>
              </div>
              <p className="text-white">
                Position: <span className="text-neon-cyan font-bold">{queuePosition}</span> of {queueSize}
              </p>
            </div>
            
            <button
              onClick={onLeaveQueue}
              disabled={!isConnected}
              className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 
                       hover:border-red-500 text-red-400 hover:text-red-300
                       py-3 px-4 rounded-lg transition-all
                       flex items-center justify-center gap-2"
            >
              <UserMinus className="w-5 h-5" />
              Leave Queue
            </button>
          </div>
        )

      case GameState.PLAYING:
        return null

      default:
        return (
          <div className="text-center text-gray-400">
            <p>Connecting to game server...</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Error Messages */}
      {errorMessage && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Success Messages */}
      {successMessage && (
        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* Main Game State Content */}
      {renderGameStateContent()}
    </div>
  )
}
