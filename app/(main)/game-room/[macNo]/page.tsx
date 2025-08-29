'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Wifi, WifiOff, X, Play, Pause, RotateCcw, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Coins, Timer, Users, Circle, Camera, SwitchCamera } from 'lucide-react'
import { getProtobufSocketClient } from '@/lib/socket/protobuf-socket-client'
import ProtobufSocketClient from '@/lib/socket/protobuf-socket-client'
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client'
import { useGameNotifications } from '@/lib/hooks/useGameNotifications'
import { useCoinNotifications } from '@/lib/hooks/useCoinNotifications'
import GameResultModal from '@/components/game/GameResultModal'
import FloatingCoinNotification from '@/components/ui/FloatingCoinNotification'
import { WawaResultNotification } from '@/lib/types/game-notifications'
import { WebRTCSignaling } from '@/lib/webrtc/signaling'
import { roomService } from '@/lib/api/room-service'

// Game states matching Flutter implementation
enum GameState {
  IDLE = 'idle',
  READY_PLAY = 'readyPlay', 
  PLAYING = 'playing',
  OTHER_PLAYING = 'otherPlaying',
  IN_QUEUE = 'inQueue'
}

export default function GameRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const macNo = params.macNo as string
  
  // Core game state - single source of truth like Flutter
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE)
  const [isConnected, setIsConnected] = useState(false)
  
  // Game play state
  const [iAmPlaying, setIAmPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [gameTimer, setGameTimer] = useState(0)
  const [coins, setCoins] = useState<number | null>(null)
  
  // Room state
  const [playerCount, setPlayerCount] = useState(1)
  const [roomInfo, setRoomInfo] = useState<any>(null)
  
  // Queue state
  const [queuePosition, setQueuePosition] = useState(0)
  const [queueSize, setQueueSize] = useState(0)
  
  // UI state
  const [isMuted, setIsMuted] = useState(false)
  const [isWaitingForServer, setIsWaitingForServer] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentCamera, setCurrentCamera] = useState<0 | 1>(0)
  const [machineData, setMachineData] = useState<any>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  
  // Other player info
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const signalingRef = useRef<WebRTCSignaling | null>(null)
  const socketClientRef = useRef<ProtobufSocketClient | null>(null)
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const coinNotifications = useCoinNotifications()
  const gameNotifications = useGameNotifications(session?.user?.id || '', coinNotifications.showCoinChange)

  // Cache for usernames to prevent repeated API calls
  const usernameCache = useRef<Map<number, string>>(new Map())

  // Fetch username by user ID with caching
  const fetchUsername = async (userId: number): Promise<string> => {
    // Check cache first
    if (usernameCache.current.has(userId)) {
      return usernameCache.current.get(userId)!
    }

    try {
      const response = await fetch(`/api/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.code === 20000 && data.data?.user) {
          const username = data.data.user.username || data.data.user.nickname || data.data.user.name || `Player #${userId}`
          usernameCache.current.set(userId, username)
          return username
        }
      }
    } catch (error) {
      console.error('Failed to fetch username:', error)
    }
    
    const fallback = `Player #${userId}`
    usernameCache.current.set(userId, fallback)
    return fallback
  }

  // Initialize coins on mount to prevent "undefined" notification
  useEffect(() => {
    gameNotifications.initializeCoins()
  }, []) // Empty deps, run once on mount

  // Initialize WebRTC with machine data
  useEffect(() => {
    // Fetch machine data and use camera URLs from it
    const fetchAndInitialize = async () => {
      if (!session?.jwt) return
      
      try {
        const data = await roomService.getLobbyData()
        if (data?.machines) {
          const machine = data.machines.find((m: any) => m.macNo === macNo)
          if (machine) {
            setMachineData(machine)
            
            // Use camera URLs from machine data only
            const cameraUrl = machine.camera0Url || machine.camera1Url
            if (cameraUrl) {
              console.log('Initializing WebRTC with machine camera URL:', cameraUrl)
              await initializeWebRTC(cameraUrl)
            } else {
              console.error('No camera URLs found in machine data')
            }
          } else {
            console.error('Machine not found in lobby data:', macNo)
          }
        }
      } catch (error) {
        console.error('Failed to fetch machine data:', error)
      }
    }
    
    fetchAndInitialize()
  }, [session, macNo])

  // Game timer countdown - reactive to game state changes
  useEffect(() => {
    if (gameState === GameState.PLAYING && iAmPlaying && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer expired - transition to idle
            setGameState(GameState.IDLE)
            setIAmPlaying(false)
            return 0
          }
          return prev - 1
        })
        setGameTimer(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [gameState, iAmPlaying, timeRemaining])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user?.id || !(session as any).socketPassword) {
      console.log('Session not ready, skipping socket connection')
      return
    }

    // Development debugging - log component reload
    console.log('🔄 GameRoom component reloaded at:', new Date().toLocaleTimeString())

    // Handle page unload (browser close, refresh, navigation)
    const handleBeforeUnload = () => {
      if (socketClientRef.current) {
        // If user is playing, send grab command like Flutter does
        if (gameState === GameState.PLAYING && iAmPlaying) {
          console.log('User exiting while playing - sending grab command')
          socketClientRef.current.sendWawaMove(WawaOptEnum.GRAB)
        }
        
        socketClientRef.current.exitRoom()
        socketClientRef.current.disconnect()
      }
    }

    // Handle page visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page is now hidden (tab switched or minimized)')
        // Don't exit room on visibility change - user may come back
        // Only track the event for analytics if needed
      } else {
        console.log('Page is now visible')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const client = new ProtobufSocketClient()
    socketClientRef.current = client

    // Set up event handlers
    client.onOpen = () => {
      console.log('Connected to game server')
      setIsConnected(true)
      // Enter room after connection
      if (macNo) {
        client.enterRoom(macNo)
      }
    }

    client.onClose = () => {
      console.log('Disconnected from game server')
      setIsConnected(false)
    }

    client.onPlayerCount = (count: number) => {
      setPlayerCount(count)
    }

    client.onEnterRoomResult = (data: any) => {
      console.log('Enter room result:', data)
      setRoomInfo(data)
      // Check if machine is currently occupied (isServerSide indicates if current user is playing)
      if (data.isServerSide === false) {
        // Another player might be playing, wait for PLAYGAMEORDER messages for current status
        console.log('Entered room, waiting for game state updates')
      }
      // Don't initialize WebRTC here - it's already done with machine data
    }

    client.onGameResult = (result: any) => {
      console.log('Game result:', result)
      setIAmPlaying(false)
      setGameState(GameState.IDLE)
      gameNotifications.handleGameResult(result)
      
      // Reset to idle state after 3 seconds
      setTimeout(() => {
        setGameState(GameState.IDLE)
        setTimeRemaining(30)
        setGameTimer(0)
      }, 3000)
    }

    client.onWawaResult = (result: any) => {
      console.log('Wawa result:', result)
      // Clear game timer
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
        gameTimerRef.current = null
      }
      
      // Clear any existing reset timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      
      const isSuccess = result.data !== 0 // Win if data > 0
      
      // Immediately disable controls
      setIAmPlaying(false)
      
      // Show result modal
      gameNotifications.handleWawaResult({ data: result.data })
      
      // Reset to idle state after 5 seconds (allows modal to display)
      resetTimeoutRef.current = setTimeout(() => {
        setGameState(GameState.IDLE)
        setTimeRemaining(0)
        setGameTimer(0)
      }, 5000)
    }

    client.onBallCount = (result: any) => {
      gameNotifications.handleBallCount(result)
    }

    client.onScore = (result: any) => {
      gameNotifications.handleScore(result)
    }

    // Handle inter-player messages
    client.onRoomMessage = (message: any) => {
      console.log('Room message received:', message)
      const msgData = message.msgData
      const senderName = message.senderUserName
      
      if (msgData?.includes('deducted')) {
        // Show feedback for mischief actions
        console.log('Mischief action completed by', senderName)
      } else if (msgData?.includes('already been mischieved')) {
        console.log('Mischief action blocked - cooldown active')
      }
    }

    // Handle queue position updates from server - PLAYGAMEORDER messages
    client.onQueueUpdate = (playGameOrder: any) => {
      console.log('PLAYGAMEORDER message:', playGameOrder)
      const order = playGameOrder.order
      const msgUserID = playGameOrder.userID ? String(playGameOrder.userID) : null
      
      // Check if this message is for the current user
      const currentUserId = String(session?.user?.id)
      const isForCurrentUser = msgUserID && msgUserID === currentUserId
      
      console.log('Message UserID:', msgUserID, 'Current UserID:', currentUserId, 'Is for current user:', isForCurrentUser, 'Order:', order)
      
      // Handle machine status messages (order 0 or 1) - these affect ALL users
      if (order === 0) {
        // Machine is FREE - anyone can play
        console.log('Machine is FREE - resetting to IDLE')
        setGameState(GameState.IDLE)
        setCurrentPlayerName(null)
        setCurrentPlayerId(null)
        setQueuePosition(0)
        setQueueSize(0)
        setIAmPlaying(false)
        setIsWaitingForServer(false)
        setTimeRemaining(0)
        
        // Clear any game timer
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current)
          gameTimerRef.current = null
        }
        
      } else if (order === 1) {
        // Machine is OCCUPIED by the userID in message
        console.log(`Machine OCCUPIED by user ${msgUserID} (current user: ${currentUserId})`)
        setCurrentPlayerId(msgUserID ? Number(msgUserID) : null)
        
        if (isForCurrentUser) {
          // Current user is playing (rare but handle it)
          console.log('Server confirms I am playing')
          setGameState(GameState.PLAYING)
          setIAmPlaying(true)
          setQueuePosition(0)
          setQueueSize(0)
        } else {
          // Someone else is playing - ALWAYS set to OTHER_PLAYING
          console.log('Setting state to OTHER_PLAYING')
          setGameState(GameState.OTHER_PLAYING)
          setIAmPlaying(false)
          setIsWaitingForServer(false)
          
          // Fetch the player's username
          if (msgUserID) {
            fetchUsername(Number(msgUserID)).then(username => {
              setCurrentPlayerName(username)
            }).catch(() => {
              setCurrentPlayerName(`Player #${msgUserID}`)
            })
          } else {
            setCurrentPlayerName('Someone')
          }
        }
        
      } else if (order > 100000 && order < 200000) {
        // Queue position message
        // Format: 1XXYYY where XX = position + 102, YYY = queue size
        const position = Math.floor((order / 1000)) - 102
        const size = order % 1000
        
        if (isForCurrentUser) {
          console.log(`Your queue position: ${position} of ${size}`)
          
          if (position > 0 && size > 0) {
            console.log('Setting state to IN_QUEUE')
            setGameState(GameState.IN_QUEUE)
            setQueuePosition(position)
            setQueueSize(size)
            setIAmPlaying(false)
            setIsWaitingForServer(false)
            
            // Don't auto-start here - wait for server to promote us with STARTGAMEMESSAGE
          }
        } else {
          console.log(`User ${msgUserID} queue position: ${position} of ${size}`)
        }
      }
    }

    // Handle start game response from server
    client.onStartGameResult = (result: any) => {
      console.log('Start game result from server:', result)
      
      // Check if this is an auto-promotion from queue (server sends this automatically)
      const wasInQueue = gameState === GameState.IN_QUEUE
      
      setIsWaitingForServer(false)
      
      if (result.startGameResult === -1) {
        // Failed to start game - show error message
        const errorMsg = result.des || 'Failed to start game'
        setErrorMessage(errorMsg)
        
        // Check specific error conditions
        if (errorMsg.includes('enough gold') || errorMsg.includes('insufficient')) {
          console.log('Insufficient coins to start game')
        } else if (errorMsg.includes('occupied')) {
          console.log('Machine is occupied by another player')
        }
        
        // Clear error after a few seconds
        setTimeout(() => setErrorMessage(null), 5000)
      } else {
        // Successfully started game
        console.log('Game approved! Starting game...')
        
        // Update game state to PLAYING - CRITICAL for control access
        console.log('Setting game state to PLAYING for control access')
        setGameState(GameState.PLAYING)
        setIAmPlaying(true)
        setQueuePosition(0)
        setQueueSize(0)
        setCurrentPlayerId(Number(session?.user?.id))
        setCurrentPlayerName(session?.user?.name || 'You')
        
        // Show appropriate notification
        if (wasInQueue) {
          console.log('Auto-promoted from queue!')
          // Update coins and show combined message
          if (result.totalGold !== undefined) {
            const newCoins = Number(result.totalGold)
            setCoins(newCoins)
            setSuccessMessage(`🎮 Your turn! Game starting... 💰 Coins: ${newCoins}`)
          } else {
            setSuccessMessage('🎮 Your turn! Game starting...')
          }
        } else {
          // Direct game start
          if (result.totalGold !== undefined) {
            const newCoins = Number(result.totalGold)
            setCoins(newCoins)
            setSuccessMessage(`💰 Game started! Coins: ${newCoins}`)
          } else {
            setSuccessMessage('🎮 Game started!')
          }
        }
        setTimeout(() => setSuccessMessage(null), 4000)
        
        setErrorMessage(null)
        setTimeRemaining(result.gameDuring || 30) // Use server's game duration
        setGameTimer(0)
        
        console.log('Game started! Duration:', result.gameDuring || 30)
        
        // Start game timer
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current)
        }
        gameTimerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              // Timer expired locally - but wait for server's WAWARESULTMESSAGE
              console.log('Game timer expired locally, waiting for server confirmation...')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }
    
    // Handle game result (WAWARESULTMESSAGE) - only received by the playing user
    client.onWawaResult = (result: any) => {
      console.log('Game ended (WAWARESULTMESSAGE):', result)
      
      // This message is only received by the player who was playing
      const catchSuccess = result.data !== 0
      if (catchSuccess) {
        console.log('You won the prize!')
        setSuccessMessage('🎉 Congratulations! You won the prize! 🎁')
        setTimeout(() => setSuccessMessage(null), 6000)
      } else {
        console.log('Better luck next time!')
        setErrorMessage('💔 Better luck next time! Try again!')
        setTimeout(() => setErrorMessage(null), 4000)
      }
      
      // Update coins if provided
      if (result.totalGold !== undefined) {
        const newCoins = Number(result.totalGold)
        setCoins(newCoins)
      }
      
      // Game has ended - reset state to IDLE for playing user
      setGameState(GameState.IDLE)
      setIAmPlaying(false)
      setCurrentPlayerName(null)
      setCurrentPlayerId(null)
      setIsWaitingForServer(false)
      
      // Clear timer if still running
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
        gameTimerRef.current = null
      }
      setTimeRemaining(0)
      
      // Note: Other users will receive PLAYGAMEORDER with order=0 to reset their states
    }
    
    // Handle player count updates
    client.onPlayerCount = (count: number) => {
      console.log('Player count update:', count)
      setPlayerCount(count)
    }

    // Connect to server
    client.connect(session.user?.id || '', (session as any).socketPassword, macNo)

    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Cleanup connections
      if (socketClientRef.current) {
        socketClientRef.current.exitRoom()
        socketClientRef.current.disconnect()
      }
      if (signalingRef.current) {
        signalingRef.current.disconnect()
      }
    }
  }, [session, macNo])

  const initializeWebRTC = async (cameraUrl: string) => {
    try {
      console.log('Initializing WebRTC for:', cameraUrl)
      
      // Clean up existing connection
      if (signalingRef.current) {
        signalingRef.current.disconnect()
      }
      
      // Create new signaling instance
      signalingRef.current = new WebRTCSignaling()
      
      // Get the stream - this returns immediately with a MediaStream
      const stream = await signalingRef.current.pullStream(cameraUrl)
      
      // Attach stream to video immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Listen for tracks to be added to the stream
        stream.onaddtrack = (event) => {
          console.log('Track added to stream:', event.track.kind)
          setIsVideoLoading(false)
        }
        
        // Try to play immediately
        videoRef.current.play().catch(e => {
          console.log('Play prevented:', e)
        })
      }
      
    } catch (error) {
      console.error('WebRTC init error:', error)
      setIsVideoLoading(false)
    }
  }

  const handleSwitchCamera = async () => {
    if (!machineData || !signalingRef.current) return
    
    const newCamera = currentCamera === 0 ? 1 : 0
    // Fixed: camera0Url is front view, camera1Url is back view
    const cameraUrl = newCamera === 0 ? machineData.camera0Url : machineData.camera1Url
    
    try {
      setIsVideoLoading(true)
      const stream = await signalingRef.current.switchCamera(cameraUrl)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCurrentCamera(newCamera)
      setIsVideoLoading(false)
    } catch (error) {
      console.error('Failed to switch camera:', error)
      setIsVideoLoading(false)
    }
  }

  const handleControl = (action: string) => {
    console.log('Control pressed:', action, { isConnected, gameState, hasSocket: !!socketClientRef.current })
  }

  const handleMove = (direction: WawaOptEnum) => {
    if (!socketClientRef.current || gameState !== GameState.PLAYING || !iAmPlaying) return
    
    let wawaOpt: WawaOptEnum
    switch (direction) {
      case WawaOptEnum.UP:
        // Up arrow means "back" in the claw machine
        wawaOpt = WawaOptEnum.DOWN
        break
      case WawaOptEnum.DOWN:
        // Down arrow means "front" in the claw machine
        wawaOpt = WawaOptEnum.UP
        break
      case WawaOptEnum.LEFT:
        wawaOpt = WawaOptEnum.LEFT
        break
      case WawaOptEnum.RIGHT:
        wawaOpt = WawaOptEnum.RIGHT
        break
      case WawaOptEnum.GRAB:
        wawaOpt = WawaOptEnum.GRAB
        break
      default:
        return
    }
    
    socketClientRef.current.sendWawaMove(wawaOpt)
  }

  const startContinuousMove = (direction: WawaOptEnum) => {
    if (gameState !== GameState.PLAYING || !iAmPlaying) return
    
    // Send first move immediately
    handleMove(direction)
    
    // Clear any existing interval
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current)
    }
    
    // Start sending moves every 100ms
    moveIntervalRef.current = setInterval(() => {
      handleMove(direction)
    }, 100)
  }

  const stopContinuousMove = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current)
      moveIntervalRef.current = null
    }
  }

  const handleStartGame = async () => {
    console.log('Requesting to start game...')
    
    // Don't change any UI state here - wait for server response
    // Clear any pending reset timeout when starting a new game
    if (!isConnected || !socketClientRef.current || isWaitingForServer) {
      console.log('Cannot start game:', { isConnected, hasSocket: !!socketClientRef.current, gameState, isWaitingForServer })
      return
    }
    
    // Only allow starting from IDLE or when we're at front of queue
    if (gameState !== GameState.IDLE && gameState !== GameState.IN_QUEUE) {
      console.log('Cannot start game from state:', gameState)
      return
    }
    
    console.log('Starting game from state:', gameState)
    setIsWaitingForServer(true)
    setErrorMessage(null)
    
    // Send start game request
    socketClientRef.current.startGame()
    // Wait for server response in onStartGameResult handler
  }

  const handleJoinQueue = () => {
    console.log('Joining queue...')
    setIsWaitingForServer(true)
    
    // Send join queue request via protobuf
    if (socketClientRef.current) {
      socketClientRef.current.joinQueue(macNo)
      // Queue state will be updated when server responds with queue position
    } else {
      console.error('Socket not connected')
      setIsWaitingForServer(false)
    }
  }

  const handleLeaveQueue = () => {
    console.log('Leaving queue...')
    
    // Send leave queue request via protobuf
    if (socketClientRef.current) {
      socketClientRef.current.leaveQueue(macNo)
      // Reset queue state immediately for responsive UI
      setGameState(GameState.IDLE)
      setQueuePosition(0)
      setQueueSize(0)
    } else {
      console.error('Socket not connected')
    }
  }

  const handleExitRoom = () => {
    if (socketClientRef.current) {
      socketClientRef.current.exitRoom()
    }
    router.push('/lobby')
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Machine {macNo}
            </h1>
            <p className="text-gray-400">
              {machineData?.name || roomInfo?.machineName || ''}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-neon-green" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm ${isConnected ? 'text-neon-green' : 'text-red-500'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Exit Button */}
            <button
              onClick={handleExitRoom}
              className="btn-neon-secondary px-4 py-2 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Room
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game View */}
          <div className="lg:col-span-2">
            <div className="card-neon p-0 overflow-hidden">
              {/* Video Stream */}
              <div className="relative aspect-[4/3] bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-contain"
                />
                
                {gameState !== GameState.PLAYING && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center p-6 max-w-md">
                      {/* Error message */}
                      {errorMessage && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-red-400">{errorMessage}</p>
                        </div>
                      )}
                      
                      {/* Success message */}
                      {successMessage && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-green-400">{successMessage}</p>
                        </div>
                      )}
                      
                      {/* Machine occupation status */}
                      {gameState === GameState.OTHER_PLAYING && !isWaitingForServer && (
                        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-yellow-400">
                            {currentPlayerName ? `${currentPlayerName} is playing` : 'Machine is currently occupied'}
                          </p>
                          {timeRemaining > 0 && (
                            <p className="text-yellow-400 text-sm mt-1">
                              Time remaining: {timeRemaining}s
                            </p>
                          )}
                          {isWaitingForServer ? (
                            <div className="flex items-center justify-center mt-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-cyan mr-2"></div>
                              <span className="text-neon-cyan text-sm">Joining queue...</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleJoinQueue}
                              className="btn-neon mt-2 px-6 py-2 text-sm"
                            >
                              Join Queue
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Queue position */}
                      {gameState === GameState.IN_QUEUE && (
                        <div className="mb-4 p-4 bg-cyan-500/20 border-2 border-cyan-500 rounded-lg backdrop-blur-sm animate-pulse-slow">
                          <p className="text-cyan-400 text-xl font-bold mb-2">
                            YOU ARE {queuePosition}/{queueSize} IN QUEUE
                          </p>
                          <p className="text-cyan-300 text-sm mb-3">Please wait for your turn...</p>
                          <button
                            onClick={handleLeaveQueue}
                            className="btn-neon-secondary px-4 py-1 text-sm"
                          >
                            Leave Queue
                          </button>
                        </div>
                      )}
                      
                      {/* Start button or loading state - only show in IDLE state */}
                      {gameState === GameState.IDLE && (
                        isWaitingForServer ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mb-4"></div>
                            <p className="text-neon-cyan">Requesting game start...</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-neon-cyan mb-4">Ready to play?</p>
                            <button
                              onClick={handleStartGame}
                              className="btn-neon px-8 py-3"
                            >
                              Start Game
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Game Info Bar */}
              <div className="p-4 bg-dark-surface flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">Cost: {machineData?.price || roomInfo?.price || 10} coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-neon-cyan" />
                    <span className="text-sm">{timeRemaining}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-pink" />
                    <span className="text-sm">{Math.max(0, playerCount - 1)} watching</span>
                  </div>
                  {queuePosition > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-yellow-400">Queue Position: {queuePosition}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="card-neon p-6">
              <h2 className="text-xl font-bold mb-6 text-neon-cyan">Controls</h2>
              
              {/* Camera Switch Button */}
              <button
                onClick={handleSwitchCamera}
                disabled={!isConnected || isVideoLoading}
                className="w-full mb-6 px-4 py-3 bg-dark-surface hover:bg-neon-purple/20 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         rounded-lg border border-neon-purple/50 
                         flex items-center justify-center gap-3 transition-all
                         hover:border-neon-purple hover:shadow-neon-purple"
              >
                <Camera className="w-5 h-5 text-neon-purple" />
                <span className="text-neon-purple font-medium">
                  {currentCamera === 0 ? 'Switch to Side View' : 'Switch to Front View'}
                </span>
                <SwitchCamera className="w-5 h-5 text-neon-purple" />
              </button>
              
              {/* D-Pad */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                {/* Up */}
                <button
                  onMouseDown={() => startContinuousMove(WawaOptEnum.UP)}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove(WawaOptEnum.UP)}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameState !== GameState.PLAYING || !iAmPlaying}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-t-lg border border-neon-cyan/50 
                           flex items-center justify-center transition-all"
                >
                  <ArrowUp className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Down */}
                <button
                  onMouseDown={() => startContinuousMove(WawaOptEnum.DOWN)}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove(WawaOptEnum.DOWN)}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameState !== GameState.PLAYING || !iAmPlaying}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-b-lg border border-neon-cyan/50
                           flex items-center justify-center transition-all"
                >
                  <ArrowDown className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Left */}
                <button
                  onMouseDown={() => startContinuousMove(WawaOptEnum.LEFT)}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove(WawaOptEnum.LEFT)}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameState !== GameState.PLAYING || !iAmPlaying}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-l-lg border border-neon-cyan/50
                           flex items-center justify-center transition-all"
                >
                  <ArrowLeft className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Right */}
                <button
                  onMouseDown={() => startContinuousMove(WawaOptEnum.RIGHT)}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove(WawaOptEnum.RIGHT)}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameState !== GameState.PLAYING || !iAmPlaying}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-r-lg border border-neon-cyan/50
                           flex items-center justify-center transition-all"
                >
                  <ArrowRight className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                             w-16 h-16 bg-dark-surface/50 rounded-lg
                             border border-neon-cyan/30" />
              </div>
              
              {/* Catch Button */}
              <button
                onClick={() => handleMove(WawaOptEnum.GRAB)}
                disabled={gameState !== GameState.PLAYING || !iAmPlaying}
                className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-purple
                         hover:shadow-neon-pink disabled:opacity-50 disabled:hover:shadow-none
                         rounded-lg font-bold text-lg transition-all
                         flex items-center justify-center gap-2"
              >
                <Circle className="w-6 h-6" />
                CATCH
              </button>
              
              {/* Instructions */}
              <div className="mt-6 p-4 bg-dark-surface/50 rounded-lg">
                <p className="text-sm text-gray-400">
                  Use arrow keys to move the claw. Press CATCH to grab prizes!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Modal */}
      <GameResultModal 
        notification={gameNotifications.currentNotification as WawaResultNotification}
        onClose={gameNotifications.clearCurrentNotification}
        onPlayAgain={handleStartGame}
      />

      {/* Floating Coin Change Notification */}
      <FloatingCoinNotification 
        change={coinNotifications.notification?.change || null}
        onComplete={coinNotifications.clearNotification}
      />
    </div>
  )
}
