'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Grab, 
  Timer, 
  Coins, 
  Volume2,
  VolumeX,
  Maximize,
  X
} from 'lucide-react'
import { useGameStore } from '@/lib/stores/game-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getProtobufSocketClient, WawaOptEnum } from '@/lib/socket/protobuf-socket-client'
import { getWebRTCClient } from '@/lib/webrtc/webrtc-client'
import { gameService } from '@/lib/api/game.service'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function GameRoomPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { data: session } = useSession()
  const { user } = useAuthStore()
  const socketClient = useRef(getProtobufSocketClient())
  const { 
    currentRoom, 
    gameState, 
    joinRoom, 
    leaveRoom, 
    sendCommand,
    updateGameState 
  } = useGameStore()

  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(60)

  // Connect to WebSocket and join room
  useEffect(() => {
    const mockRoom = {
      id: params.id as string,
      name: 'Neon Crane Master',
      description: 'Classic claw machine with neon prizes',
      status: 'available' as const,
      streamUrl: 'wss://stream.example.com/room/' + params.id,
      thumbnailUrl: '',
      queueLength: 0,
      difficulty: 'medium' as const,
      coinCost: 15,
      coinReward: 75,
    }
    joinRoom(mockRoom)

    // Connect to protobuf WebSocket if we have session
    if (session?.user?.id && session?.socketPassword) {
      const socket = socketClient.current
      
      // Set up event handlers
      socket.onPlayerCount = (count) => {
        console.log('Player count:', count)
      }
      
      socket.onGameResult = (result) => {
        console.log('Game result:', result)
        if (result.gameFinishFlag === 1) {
          toast.success(`Game ended! Gold: ${result.totalGold}, Score: ${result.totalScore}`)
        }
      }
      
      socket.onEnterRoomResult = (data) => {
        console.log('Enter room result:', data)
        if (data.totalGold >= 0) {
          updateGameState({ coins: Number(data.totalGold) })
        }
      }
      
      // Connect and join room
      socket.connect(session.user.id, session.socketPassword, params.id as string)
        .then(() => {
          socket.enterRoom(params.id as string)
        })
        .catch((error) => {
          console.error('Failed to connect to WebSocket:', error)
          toast.error('Failed to connect to game server')
        })
    }

    // Cleanup on unmount
    return () => {
      socketClient.current.exitRoom()
      socketClient.current.disconnect()
      leaveRoom()
    }
  }, [params.id, session])

  // Timer countdown
  useEffect(() => {
    if (gameState?.isPlaying && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleGameEnd('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState?.isPlaying, timeRemaining])

  const handleGameEnd = (result: 'win' | 'lose' | 'timeout') => {
    if (result === 'win') {
      toast.success(`Congratulations! You won ${currentRoom?.coinReward} coins!`)
    } else if (result === 'timeout') {
      toast.error('Time\'s up! Better luck next time!')
    }
    
    // Navigate back to lobby after a delay
    setTimeout(() => {
      router.push('/lobby')
    }, 3000)
  }

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameState?.isPlaying) return
    
    const directionMap = {
      'up': WawaOptEnum.UP,
      'down': WawaOptEnum.DOWN,
      'left': WawaOptEnum.LEFT,
      'right': WawaOptEnum.RIGHT,
    }
    
    socketClient.current.sendWawaMove(directionMap[direction])
    sendCommand({
      type: 'move',
      direction,
      timestamp: Date.now(),
    })
  }

  const handleGrab = () => {
    if (!gameState?.isPlaying) return
    
    socketClient.current.sendWawaMove(WawaOptEnum.GRAB)
    sendCommand({
      type: 'grab',
      timestamp: Date.now(),
    })
  }
  
  const handleStartGame = async () => {
    if (!session?.user?.id) {
      toast.error('Please login to play')
      return
    }
    
    if ((user?.coins || 0) < currentRoom.coinCost) {
      toast.error('Insufficient coins!')
      return
    }
    
    socketClient.current.startGame()
    updateGameState({ isPlaying: true })
    setTimeRemaining(60)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading game room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-1">{currentRoom.name}</h1>
          <p className="text-gray-400">{currentRoom.description}</p>
        </div>
        <button
          onClick={() => router.push('/lobby')}
          className="btn-neon btn-neon-pink px-4 py-2 flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Exit Game
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Stream */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2"
        >
          <div className="card-neon border-2 border-neon-cyan relative aspect-video bg-black overflow-hidden">
            {/* Video Stream Placeholder */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              playsInline
            />
            
            {/* Stream Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex justify-between items-start">
                  {/* Timer */}
                  <div className="flex items-center gap-2 bg-dark-card/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Timer className="w-5 h-5 text-neon-cyan" />
                    <span className="font-mono text-xl font-bold">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex gap-2 pointer-events-auto">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 bg-dark-card/80 backdrop-blur-sm rounded-lg hover:bg-dark-surface transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-dark-card/80 backdrop-blur-sm rounded-lg hover:bg-dark-surface transition-colors"
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Position Indicator */}
              <div className="absolute bottom-4 left-4 bg-dark-card/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                <p className="text-sm text-gray-400">Position</p>
                <p className="font-mono">
                  X: {gameState?.position.x || 0} Y: {gameState?.position.y || 0}
                </p>
              </div>
            </div>

            {/* No Stream Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-dark-surface">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-neon-cyan/20 flex items-center justify-center mx-auto mb-4">
                  <Grab className="w-10 h-10 text-neon-cyan animate-pulse" />
                </div>
                <p className="text-gray-400 mb-2">Stream will start soon</p>
                <p className="text-sm text-gray-500">Connecting to game machine...</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Game Info */}
          <div className="card-neon border-2 border-neon-purple">
            <h3 className="text-lg font-semibold mb-4">Game Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Cost</span>
                <span className="font-semibold flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  {currentRoom.coinCost}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reward</span>
                <span className="font-semibold flex items-center gap-1">
                  <Coins className="w-4 h-4 text-neon-green" />
                  +{currentRoom.coinReward}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Balance</span>
                <span className="font-semibold flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  {user?.coins || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Joystick Controls */}
          <div className="card-neon border-2 border-neon-cyan">
            <h3 className="text-lg font-semibold mb-4">Controls</h3>
            
            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mb-6">
              <div />
              <button
                onMouseDown={() => handleMove('up')}
                disabled={!gameState?.isPlaying}
                className="btn-neon btn-neon-cyan p-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
              <div />
              <button
                onMouseDown={() => handleMove('left')}
                disabled={!gameState?.isPlaying}
                className="btn-neon btn-neon-cyan p-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-4 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse" />
              </div>
              <button
                onMouseDown={() => handleMove('right')}
                disabled={!gameState?.isPlaying}
                className="btn-neon btn-neon-cyan p-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
              <div />
              <button
                onMouseDown={() => handleMove('down')}
                disabled={!gameState?.isPlaying}
                className="btn-neon btn-neon-cyan p-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
              <div />
            </div>

            {/* Grab Button */}
            <button
              onClick={handleGrab}
              disabled={!gameState?.isPlaying}
              className="w-full btn-neon btn-neon-green py-4 flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Grab className="w-6 h-6" />
              GRAB
            </button>
            
            {/* Start Game Button */}
            {!gameState?.isPlaying && (
              <button
                onClick={handleStartGame}
                className="w-full btn-neon btn-neon-cyan py-4 flex items-center justify-center gap-2 text-lg font-bold mt-4"
              >
                <Coins className="w-6 h-6" />
                START GAME ({currentRoom.coinCost} coins)
              </button>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
              Use arrow buttons to move, press GRAB when ready
            </p>
          </div>

          {/* Tips */}
          <div className="card-neon">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Pro Tips</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Position the claw carefully before grabbing</li>
              <li>• Watch the timer - plan your moves</li>
              <li>• Lighter prizes are easier to grab</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
