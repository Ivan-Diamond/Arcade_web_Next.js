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

export default function GameRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const macNo = params.macNo as string
  
  const [isConnected, setIsConnected] = useState(false)
  const [isGameActive, setIsGameActive] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'result' | 'ended'>('waiting')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [gameTimer, setGameTimer] = useState(0)
  const [coins, setCoins] = useState<number | null>(null)
  const [playerCount, setPlayerCount] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const [isWaitingForServer, setIsWaitingForServer] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [machineOccupied, setMachineOccupied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentCamera, setCurrentCamera] = useState<0 | 1>(0)
  const [machineData, setMachineData] = useState<any>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const [isInQueue, setIsInQueue] = useState(false)
  const [isJoiningQueue, setIsJoiningQueue] = useState(false)
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

  // Game timer countdown - both timeRemaining and gameTimer
  useEffect(() => {
    if (gameStatus === 'playing' && gameTimer > 0) {
      const interval = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) {
            setGameStatus('ended')
            setIsGameActive(false)
            return 0
          }
          return prev - 1
        })
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [gameStatus, gameTimer])

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
        if (gameStatus === 'playing') {
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
      setIsGameActive(false)
      setGameStatus('ended')
      gameNotifications.handleGameResult(result)
      
      // Reset to idle state after 3 seconds
      setTimeout(() => {
        setGameStatus('waiting')
        setTimeRemaining(30)
        setGameTimer(0)
        // Mark machine as available after your game ends
        setMachineOccupied(false)
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
      
      const isSuccess = result.data === 1
      
      // Immediately disable controls
      setIsGameActive(false)
      
      // Show result modal
      setGameStatus('result')
      gameNotifications.handleWawaResult({ data: result.data })
      
      // Reset to idle state after 4 seconds (allows modal to display)
      resetTimeoutRef.current = setTimeout(() => {
        setGameStatus('waiting')
        setTimeRemaining(0)
        setGameTimer(0)
        // Mark machine as available after your game ends
        setMachineOccupied(false)
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

    // Handle queue position updates from server
    client.onQueueUpdate = (playGameOrder: any) => {
      console.log('Queue/Game state update:', playGameOrder)
      const order = playGameOrder.order
      const msgUserID = playGameOrder.userID
      
      // Check if this message is for the current user
      const isForCurrentUser = msgUserID === session?.user?.id
      
      if (!isForCurrentUser) {
        // Message is about another player
        if (order === 1) {
          // Someone else is playing - machine is occupied
          setCurrentPlayerId(msgUserID)
          console.log('Machine occupied by user:', msgUserID)
          
          // Fetch the player's username and update state atomically
          fetchUsername(msgUserID).then(username => {
            // Batch state updates to prevent race conditions
            setMachineOccupied(true)
            setCurrentPlayerName(username)
          }).catch(() => {
            // Fallback if username fetch fails
            setMachineOccupied(true)
            setCurrentPlayerName(`Player #${msgUserID}`)
          })
        } else if (order === 0) {
          // No one is playing - machine is available
          setMachineOccupied(false)
          setCurrentPlayerName(null)
          setCurrentPlayerId(null)
          console.log('Machine is now available')
        }
      } else {
        // Message is for the current user
        if (order > 100000 && order < 200000) {
          // Queue position format: 1XXYYY
          const position = Math.floor(order / 1000) - 102
          const queueSize = order % 1000
          
          console.log(`Your queue position: ${position} of ${queueSize}`)
          
          if (position > 0 && queueSize > 0) {
            setIsInQueue(true)
            setIsJoiningQueue(false)
            setQueuePosition(position)
            
            // Auto-start when reaching front of queue
            if (position === 1) {
              console.log('You are at the front of the queue!')
              // Reduce delay for more responsive queue progression
              setTimeout(() => {
                if (socketClientRef.current && !isWaitingForServer) {
                  handleStartGame()
                }
              }, 500)
            }
          }
        } else if (order === 0) {
          // Machine is available - you can play now
          setIsInQueue(false)
          setQueuePosition(null)
          setMachineOccupied(false)
        } else if (order === 1) {
          // Should not happen for current user
          console.warn('Unexpected order=1 for current user')
        } else if (order === 2) {
          // You are currently playing - clear queue state and start game
          console.log('Server confirmed you are playing - auto-starting game')
          setIsInQueue(false)
          setQueuePosition(null)
          setIsJoiningQueue(false)
          setMachineOccupied(false)
          
          // Auto-start the game when promoted from queue
          if (!isGameActive && socketClientRef.current) {
            console.log('Auto-starting game from queue promotion - sending start game message')
            // Send start game message to server
            socketClientRef.current.startGame()
            setIsWaitingForServer(true)
            // Game state will be set by onStartGameResult handler
          }
        }
      }
    }

    // Handle start game response from server
    client.onStartGameResult = (result: any) => {
      console.log('Start game result from server:', result)
      setIsWaitingForServer(false)
      
      if (result.startGameResult === -1) {
        // Failed to start game - show error message
        const errorMsg = result.des || 'Failed to start game'
        setErrorMessage(errorMsg)
        
        // Check specific error conditions
        if (errorMsg.includes('enough gold') || errorMsg.includes('insufficient')) {
          console.log('Insufficient coins to start game')
          // Update coins if provided
          if (result.totalGold !== undefined) {
            setCoins(result.totalGold)
          }
        } else {
          setMachineOccupied(true)
        }
        
        // Clear error after 3 seconds for faster feedback
        setTimeout(() => setErrorMessage(null), 3000)
      } else {
        // Game approved - clear queue state and enable controls
        setIsInQueue(false)
        setQueuePosition(null)
        setIsJoiningQueue(false)
        setMachineOccupied(false)
        
        // Update coins (game cost deducted by server)
        if (result.totalGold !== undefined) {
          setCoins(result.totalGold)
        }
        
        setIsGameActive(true)
        setGameStatus('playing')
        setErrorMessage(null)
        setTimeRemaining(result.gameDuring || 30) // Use server's game duration
        
        console.log('Game started! Cleared queue state. Duration:', result.gameDuring || 30)
        
        // Start countdown timer
        gameTimerRef.current = setInterval(() => {
          setGameTimer(prev => prev + 1)
          setTimeRemaining(prev => {
            if (prev <= 1) {
              // Game time ended
              setIsGameActive(false)
              setGameStatus('ended')
              clearInterval(gameTimerRef.current!)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }
    
    // Handle game result (when game ends)
    client.onGameResult = (result: any) => {
      console.log('🎮 Game result received at:', new Date().toLocaleTimeString(), result)
      
      // Update user's coins and score
      if (result.totalGold !== undefined) {
        setCoins(result.totalGold)
      }
      
      // Reset game state
      setIsGameActive(false)
      setGameStatus('waiting')
      setTimeRemaining(0)
      setGameTimer(0)
      
      // Clear any timers
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
        gameTimerRef.current = null
      }
      
      // Check if there's a queue and handle auto-progression
      // The server will send PLAYGAMEORDER messages to handle queue progression
      console.log('Game ended, waiting for server queue updates')
    }
    
    // Handle player count updates
    client.onPlayerCount = (count: number) => {
      console.log('Player count update:', count)
      setPlayerCount(count)
    }
    
    // Handle enter room response
    client.onEnterRoomResult = (result: any) => {
      console.log('Enter room result:', result)
      if (result.isMeOperation) {
        // User already has control
        setMachineOccupied(false)
      } else if (result.playTimes && result.playTimes > 0) {
        // Someone else is playing
        setMachineOccupied(true)
        setTimeRemaining(result.playTimes)
        
        // Start a timer to reset when other player is done
        setTimeout(() => {
          setMachineOccupied(false)
          setTimeRemaining(0)
        }, result.playTimes * 1000)
      }
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
    console.log('Control pressed:', action, { isConnected, gameStatus, hasSocket: !!socketClientRef.current })
  }

  const handleMove = (direction: string) => {
    if (!socketClientRef.current || !isGameActive) return
    
    let wawaOpt: WawaOptEnum
    switch (direction) {
      case 'up':
        // Up arrow means "back" in the claw machine
        wawaOpt = WawaOptEnum.DOWN
        break
      case 'down':
        // Down arrow means "front" in the claw machine
        wawaOpt = WawaOptEnum.UP
        break
      case 'left':
        wawaOpt = WawaOptEnum.LEFT
        break
      case 'right':
        wawaOpt = WawaOptEnum.RIGHT
        break
      case 'grab':
        wawaOpt = WawaOptEnum.GRAB
        break
      default:
        return
    }
    
    socketClientRef.current.sendWawaMove(wawaOpt)
  }

  const startContinuousMove = (direction: string) => {
    if (!isGameActive) return
    
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

  const handleStartGame = () => {
    console.log('Requesting to start game...')
    
    // Don't change any UI state here - wait for server response
    // Clear any pending reset timeout when starting a new game
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    
    if (socketClientRef.current) {
      setIsWaitingForServer(true)
      setErrorMessage(null)
      // Send start game request - UI will update based on server response
      socketClientRef.current.startGame()
      // Do NOT set game active or playing here - wait for server confirmation
    }
  }

  const handleJoinQueue = () => {
    console.log('Joining queue...')
    setIsJoiningQueue(true)
    
    // Send join queue request via protobuf
    if (socketClientRef.current) {
      socketClientRef.current.joinQueue(macNo)
      // Queue state will be updated when server responds with queue position
    } else {
      console.error('Socket not connected')
      setIsJoiningQueue(false)
    }
  }

  const handleLeaveQueue = () => {
    console.log('Leaving queue...')
    
    // Send leave queue request via protobuf
    if (socketClientRef.current) {
      socketClientRef.current.leaveQueue(macNo)
      // Reset queue state immediately for responsive UI
      setIsInQueue(false)
      setQueuePosition(null)
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
                
                {gameStatus === 'waiting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center p-6 max-w-md">
                      {/* Error message */}
                      {errorMessage && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-red-400">{errorMessage}</p>
                        </div>
                      )}
                      
                      {/* Machine occupation status */}
                      {machineOccupied && !isWaitingForServer && !isInQueue && (
                        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-yellow-400">
                            {currentPlayerName ? `${currentPlayerName} is playing` : 'Machine is currently occupied'}
                          </p>
                          {timeRemaining > 0 && (
                            <p className="text-yellow-400 text-sm mt-1">
                              Time remaining: {timeRemaining}s
                            </p>
                          )}
                          {isJoiningQueue ? (
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
                      {isInQueue && queuePosition !== null && queuePosition > 0 && (
                        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg backdrop-blur-sm">
                          <p className="text-blue-400 mb-2">Your position in queue: {queuePosition}</p>
                          <button
                            onClick={handleLeaveQueue}
                            className="btn-neon-secondary px-4 py-1 text-sm"
                          >
                            Leave Queue
                          </button>
                        </div>
                      )}
                      
                      {/* Start button or loading state */}
                      {!machineOccupied && (
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
                  {queuePosition !== null && queuePosition > 0 && (
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
                  onMouseDown={() => startContinuousMove('up')}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove('up')}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameStatus !== 'playing'}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-t-lg border border-neon-cyan/50 
                           flex items-center justify-center transition-all"
                >
                  <ArrowUp className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Down */}
                <button
                  onMouseDown={() => startContinuousMove('down')}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove('down')}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameStatus !== 'playing'}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-b-lg border border-neon-cyan/50
                           flex items-center justify-center transition-all"
                >
                  <ArrowDown className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Left */}
                <button
                  onMouseDown={() => startContinuousMove('left')}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove('left')}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameStatus !== 'playing'}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16
                           bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                           rounded-l-lg border border-neon-cyan/50
                           flex items-center justify-center transition-all"
                >
                  <ArrowLeft className="w-6 h-6 text-neon-cyan" />
                </button>
                
                {/* Right */}
                <button
                  onMouseDown={() => startContinuousMove('right')}
                  onMouseUp={stopContinuousMove}
                  onMouseLeave={stopContinuousMove}
                  onTouchStart={() => startContinuousMove('right')}
                  onTouchEnd={stopContinuousMove}
                  disabled={gameStatus !== 'playing'}
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
                onClick={() => handleMove('grab')}
                disabled={gameStatus !== 'playing'}
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
