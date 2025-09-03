'use client'

import React, { useState, useRef } from 'react'
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Grab, Camera, SwitchCamera, Play, Users, Timer, UserPlus, UserMinus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export enum GameState {
  IDLE = 'idle',
  READY_PLAY = 'readyPlay', 
  PLAYING = 'playing',
  OTHER_PLAYING = 'otherPlaying',
  IN_QUEUE = 'inQueue'
}

interface MobileGameControlsProps {
  startContinuousMove: (direction: WawaOptEnum) => void
  stopContinuousMove: () => void
  handleMove: (direction: WawaOptEnum) => void
  onSwitchCamera?: () => void
  disabled: boolean
  currentCamera: 0 | 1
  // Game management props
  gameState: GameState
  currentPlayerName: string | null
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

export function MobileGameControls({
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  onSwitchCamera,
  disabled,
  currentCamera,
  gameState,
  currentPlayerName,
  queuePosition,
  queueSize,
  timeRemaining,
  isWaitingForServer,
  errorMessage,
  successMessage,
  isConnected,
  onStartGame,
  onJoinQueue,
  onLeaveQueue,
}: MobileGameControlsProps) {
  const [activeButton, setActiveButton] = useState<WawaOptEnum | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const joystickRef = useRef<HTMLDivElement>(null)
  
  // Handle touch controls for continuous movement
  const handleTouchStart = (direction: WawaOptEnum) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (disabled) return
    setActiveButton(direction)
    startContinuousMove(direction)
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setActiveButton(null)
    stopContinuousMove()
  }
  
  // Handle grab button
  const handleGrab = () => {
    if (disabled) return
    handleMove(WawaOptEnum.GRAB)
    
    // Stronger haptic feedback for grab
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50])
    }
  }
  
  // Virtual joystick for movement
  const handleJoystickTouch = (e: React.TouchEvent) => {
    if (disabled || !joystickRef.current) return
    
    const touch = e.touches[0]
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = touch.clientX - centerX
    const deltaY = touch.clientY - centerY
    
    const threshold = 30 // pixels from center to trigger movement
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > threshold) {
        startContinuousMove(WawaOptEnum.RIGHT)
        setActiveButton(WawaOptEnum.RIGHT)
      } else if (deltaX < -threshold) {
        startContinuousMove(WawaOptEnum.LEFT)
        setActiveButton(WawaOptEnum.LEFT)
      }
    } else {
      // Vertical movement
      if (deltaY > threshold) {
        startContinuousMove(WawaOptEnum.DOWN) // Inverted for claw machine
        setActiveButton(WawaOptEnum.DOWN)
      } else if (deltaY < -threshold) {
        startContinuousMove(WawaOptEnum.UP) // Inverted for claw machine
        setActiveButton(WawaOptEnum.UP)
      }
    }
  }
  
  const handleJoystickTouchEnd = () => {
    setActiveButton(null)
    stopContinuousMove()
  }

  const renderGameManagementRow = () => {
    switch (gameState) {
      case GameState.IDLE:
        return (
          <div className="flex items-center gap-2 mb-3">
            {isWaitingForServer ? (
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
                <span className="text-neon-cyan text-sm">Starting...</span>
              </div>
            ) : (
              <button
                onClick={onStartGame}
                disabled={!isConnected}
                className="flex-1 btn-neon py-2 px-4 text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Game
              </button>
            )}
            <button
              onClick={onSwitchCamera}
              disabled={!isConnected}
              className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                       flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )

      case GameState.OTHER_PLAYING:
        return (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  {currentPlayerName || 'Someone'} playing
                </span>
              </div>
              {timeRemaining > 0 && (
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-xs">{timeRemaining}s</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isWaitingForServer ? (
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
                  <span className="text-neon-cyan text-sm">Joining...</span>
                </div>
              ) : (
                <button
                  onClick={onJoinQueue}
                  disabled={!isConnected}
                  className="flex-1 btn-neon-secondary py-2 px-4 text-sm flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Queue
                </button>
              )}
              <button
                onClick={onSwitchCamera}
                disabled={!isConnected}
                className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                         flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          </div>
        )

      case GameState.IN_QUEUE:
        return (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">
                Queue: {queuePosition}/{queueSize}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLeaveQueue}
                disabled={!isConnected}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 
                         text-red-400 py-2 px-4 rounded-lg text-sm
                         flex items-center justify-center gap-2"
              >
                <UserMinus className="w-4 h-4" />
                Leave Queue
              </button>
              <button
                onClick={onSwitchCamera}
                disabled={!isConnected}
                className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                         flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          </div>
        )

      case GameState.PLAYING:
        return (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Playing!</span>
              {timeRemaining > 0 && (
                <>
                  <Timer className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">{timeRemaining}s</span>
                </>
              )}
            </div>
            <button
              onClick={onSwitchCamera}
              disabled={!isConnected}
              className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                       flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )

      default:
        return (
          <div className="flex justify-end mb-3">
            <button
              onClick={onSwitchCamera}
              disabled={!isConnected}
              className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                       flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-md border-t border-neon-cyan/30 p-4 md:hidden">
      {/* Error Messages */}
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Success Messages */}
      {successMessage && (
        <div className="mb-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-green-400 text-xs">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Game Management Row */}
      {renderGameManagementRow()}
      
      {/* Game Controls - Only show when playing */}
      {gameState === GameState.PLAYING && (
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Virtual Joystick */}
          <div className="relative">
            <div 
              ref={joystickRef}
              className="w-32 h-32 relative"
              onTouchMove={handleJoystickTouch}
              onTouchEnd={handleJoystickTouchEnd}
            >
              {/* Joystick background */}
              <div className="absolute inset-0 rounded-full bg-dark-surface/50 border-2 border-neon-cyan/30" />
            
              {/* Direction indicators */}
              <button
                onTouchStart={handleTouchStart(WawaOptEnum.UP)}
                onTouchEnd={handleTouchEnd}
                disabled={false}
                className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 
                         rounded-full flex items-center justify-center
                         ${activeButton === WawaOptEnum.UP 
                           ? 'bg-neon-cyan text-black scale-110' 
                           : 'bg-dark-surface/80 text-neon-cyan'}
                         transition-all`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            
              <button
                onTouchStart={handleTouchStart(WawaOptEnum.DOWN)}
                onTouchEnd={handleTouchEnd}
                disabled={false}
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 
                         rounded-full flex items-center justify-center
                         ${activeButton === WawaOptEnum.DOWN 
                           ? 'bg-neon-cyan text-black scale-110' 
                           : 'bg-dark-surface/80 text-neon-cyan'}
                         transition-all`}
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              
              <button
                onTouchStart={handleTouchStart(WawaOptEnum.LEFT)}
                onTouchEnd={handleTouchEnd}
                disabled={false}
                className={`absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 
                         rounded-full flex items-center justify-center
                         ${activeButton === WawaOptEnum.LEFT 
                           ? 'bg-neon-cyan text-black scale-110' 
                           : 'bg-dark-surface/80 text-neon-cyan'}
                         transition-all`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <button
                onTouchStart={handleTouchStart(WawaOptEnum.RIGHT)}
                onTouchEnd={handleTouchEnd}
                disabled={false}
                className={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 
                         rounded-full flex items-center justify-center
                         ${activeButton === WawaOptEnum.RIGHT 
                           ? 'bg-neon-cyan text-black scale-110' 
                           : 'bg-dark-surface/80 text-neon-cyan'}
                         transition-all`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            w-4 h-4 rounded-full bg-neon-cyan/50" />
            </div>
          </div>
        
          {/* Right side - Grab button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault()
              handleGrab()
            }}
            disabled={false}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1
                     bg-gradient-to-br from-neon-pink to-neon-purple text-white active:scale-95
                     shadow-lg transition-all font-bold text-lg`}
          >
            <Grab className="w-8 h-8" />
            <span className="text-xs">GRAB</span>
          </button>
        </div>
      )}
      
      {/* Game status indicator */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">
          Swipe or tap to control
        </p>
      </div>
    </div>
  )
}
