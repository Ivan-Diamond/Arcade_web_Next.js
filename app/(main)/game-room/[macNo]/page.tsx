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
import { useMobileDetect } from '@/lib/hooks/useMobileDetect'
import GameResultModal from '@/components/game/GameResultModal'
import FloatingCoinNotification from '@/components/ui/FloatingCoinNotification'
import { WawaResultNotification } from '@/lib/types/game-notifications'
import { WebRTCSignaling } from '@/lib/webrtc/signaling'
import { roomService } from '@/lib/api/room-service'
import { GameControls } from '@/components/game-controls/GameControls'
import { MobileGameControls } from '@/components/game-controls/MobileGameControls'
import HowToPlay from '@/components/game/HowToPlay'
import { amplitudeService } from '@/lib/analytics/amplitude'
import { GameManagementPanel } from '@/components/game/GameManagementPanel'
import { formatMachineName } from '@/lib/utils/formatMachineName'

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
  const { isMobile, isTablet, isTouchDevice } = useMobileDetect()
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
      const response = await fetch(`/app/api/user/${userId}`)
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
    
    // Track game room page view
    amplitudeService.trackGameEvent('ROOM_ENTERED', {
      machine_id: macNo,
      source: 'lobby'
    })
  }, []) // Empty deps, run once on mount

  // Initialize WebRTC with machine data
  useEffect(() => {
    // Fetch machine data and use camera URLs from it
    const fetchAndInitialize = async () => {
      if (!session?.user?.jwt) return
      
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

  // Game timer countdown - DECORATIVE ONLY (no game state control)
  useEffect(() => {
    if (gameState === GameState.PLAYING && iAmPlaying && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer expired visually - but don't change game state
            // Let server control when game actually ends
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
    console.log('Session data:', session)
    console.log('User ID:', session?.user?.id)
    console.log('Socket password:', (session as any)?.user?.socketPassword)
    
    if (!session?.user?.id || !(session as any)?.user?.socketPassword) {
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
      
      // Track WebRTC connection success
      amplitudeService.trackGameEvent('WEBRTC_CONNECTED', {
        machine_id: macNo
      })
      
      // Enter room after connection
      if (macNo) {
        client.enterRoom(macNo)
      }
    }

    client.onClose = () => {
      console.log('Disconnected from game server')
      setIsConnected(false)
      
      // Track WebRTC disconnection
      amplitudeService.trackGameEvent('WEBRTC_DISCONNECTED', {
        machine_id: macNo
      })
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

    //not used
    client.onGameResult = (result: any) => {
      
    }

    //game result
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
      
      // Track game completion
      amplitudeService.trackGameEvent('GAME_COMPLETED', {
        machine_id: macNo,
        result: isSuccess ? 'win' : 'loss',
        win_amount: isSuccess ? result.data : 0,
        play_duration: gameTimer
      })
      
      // Immediately disable controls
      setIAmPlaying(false)
      
      // Show result modal
      gameNotifications.handleWawaResult({ data: result.data })
      
      // Reset to idle state after 5 seconds (allows modal to display)
      setGameState(GameState.IDLE)
      setTimeRemaining(0)
      setGameTimer(0)
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
      const order: number = playGameOrder.order
      const msgUserID = playGameOrder.userID ? String(playGameOrder.userID) : null
      
      // Check if this message is for the current user
      const currentUserId = String(session?.user?.id)
      const isForCurrentUser = msgUserID !== null && msgUserID === currentUserId
      
      console.log('Message UserID:', msgUserID, 'Current UserID:', currentUserId, 'Is for current user:', isForCurrentUser, 'Order:', order)
      
      // Handle machine status messages (order 0 or 1) - these affect ALL users
      if(isForCurrentUser === false){
        if (order === 0 || order === undefined) {
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
          // Someone else is playing - set to OTHER_PLAYING
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
        
        // Track game started event
        amplitudeService.trackGameEvent('GAME_STARTED', {
          machine_id: macNo,
          source: wasInQueue ? 'queue' : 'direct',
          game_duration: result.gameDuring || 30,
          coins_cost: machineData?.price || 10,
          user_coins_after: result.totalGold
        })
        
        // Update game state to PLAYING - CRITICAL for control access
        console.log('Setting game state to PLAYING for control access')
        setGameState(GameState.PLAYING)
        setIAmPlaying(true)
        setQueuePosition(0)
        setQueueSize(0)
        
        // Trigger coin notification for game start (deduction)
        gameNotifications.handleGameStart({})
        setCurrentPlayerId(Number(session?.user?.id))
        setCurrentPlayerName(session?.user?.name || 'You')
        
        // Show appropriate notification
        if (wasInQueue) {
          console.log('Auto-promoted from queue!')
          // Update coins and show combined message
          if (result.totalGold !== undefined) {
            const newCoins = Number(result.totalGold)
            setCoins(newCoins)
            // Sync coins with Amplitude user properties
            amplitudeService.updateUserProperties({ coins: newCoins })
            setSuccessMessage(`🎮 Your turn! Game starting...`)
          } else {
            setSuccessMessage('🎮 Your turn! Game starting...')
          }
        } else {
          // Direct game start - update coins without showing success message
          if (result.totalGold !== undefined) {
            const newCoins = Number(result.totalGold)
            setCoins(newCoins)
            // Sync coins with Amplitude user properties
            amplitudeService.updateUserProperties({ coins: newCoins })
          }
        }
        setTimeout(() => setSuccessMessage(null), 4000)
        
        setErrorMessage(null)
        setTimeRemaining(result.gameDuring || 30) // Use server's game duration
        setGameTimer(0)
        
        // Clear any existing game timer (timer is now handled by useEffect)
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current)
          gameTimerRef.current = null
        }
        
        console.log('Game started! Duration:', result.gameDuring || 30)
      }
    }
    
    // Handle player count updates
    client.onPlayerCount = (count: number) => {
      console.log('Player count update:', count)
      setPlayerCount(count)
    }

    // Connect to server
    client.connect(session.user?.id || '', (session as any)?.user?.socketPassword, macNo)

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
    
    // Track camera switch event
    amplitudeService.trackGameEvent('CAMERA_SWITCHED', {
      machine_id: macNo,
      from_camera: currentCamera,
      to_camera: newCamera
    })
    
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
    let controlAction: string
    switch (direction) {
      case WawaOptEnum.UP:
        // Up arrow means "back" in the claw machine
        wawaOpt = WawaOptEnum.DOWN
        controlAction = 'up'
        break
      case WawaOptEnum.DOWN:
        // Down arrow means "front" in the claw machine
        wawaOpt = WawaOptEnum.UP
        controlAction = 'down'
        break
      case WawaOptEnum.LEFT:
        wawaOpt = WawaOptEnum.LEFT
        controlAction = 'left'
        break
      case WawaOptEnum.RIGHT:
        wawaOpt = WawaOptEnum.RIGHT
        controlAction = 'right'
        break
      case WawaOptEnum.GRAB:
        wawaOpt = WawaOptEnum.GRAB
        controlAction = 'grab'
        // Track grab/drop action specifically
        amplitudeService.trackGameEvent('CLAW_DROPPED', {
          machine_id: macNo,
          timing: gameTimer
        })
        break
      default:
        return
    }
    
    // Track control usage (but not for grab as it's tracked separately)
    if (direction !== WawaOptEnum.GRAB) {
      amplitudeService.trackGameEvent('CONTROL_USED', {
        machine_id: macNo,
        control_action: controlAction as any,
        control_type: 'button'
      })
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
    
    // Track start button click
    amplitudeService.trackGameEvent('START_BUTTON_CLICKED', {
      machine_id: macNo,
      source: gameState === GameState.IN_QUEUE ? 'queue' : 'direct'
    })
    
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
    
    // Track queue join
    amplitudeService.trackGameEvent('JOINED_QUEUE', {
      machine_id: macNo
    })
    
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
    
    // Track queue leave
    amplitudeService.trackGameEvent('LEFT_QUEUE', {
      machine_id: macNo,
      queue_position: queuePosition,
      queue_size: queueSize
    })
    
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
<div className={`min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg ${!isMobile ? 'p-4' : ''}`}>
  <div className={isMobile ? '' : 'max-w-7xl mx-auto'}>
    {/* Header - Responsive */}
    <div className={`flex items-center justify-between ${isMobile ? 'p-3 bg-dark-surface/90 backdrop-blur-md border-b border-neon-cyan/30' : 'mb-6'}`}>
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => router.push('/lobby')}
          className={`${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} btn-neon-secondary`}
        >
          <span className="hidden sm:inline">← Back to Lobby</span>
          <span className="sm:hidden">← Back</span>
        </button>
        <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gradient truncate max-w-[150px] sm:max-w-none`}>
          {machineData?.gameName ? formatMachineName(machineData.gameName) : machineData?.name || `Machine ${macNo}`}
        </h1>
      </div>
      
      {/* Connection Status - Only show when disconnected */}
      {!isConnected && (
        <div className="flex items-center gap-1 md:gap-2">
          <WifiOff className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} />
          <span className={`text-red-500 ${isMobile ? 'text-sm' : ''} hidden sm:inline`}>Disconnected</span>
        </div>
      )}
    </div>
    {/* Main Content - Responsive Grid */}
    <div className={`${isMobile ? '' : 'grid lg:grid-cols-3 gap-6'}`}>
      {/* Video and Game Area - Full width on mobile */}
      <div className={`${isMobile ? '' : 'lg:col-span-2 space-y-4'}`}>
        <div className={`${isMobile ? '' : 'card-neon'} overflow-hidden`}>
          {/* Video Player - Responsive aspect ratio */}
          <div className={`relative bg-black ${isMobile ? 'aspect-[4/3]' : 'aspect-video'}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-contain"
            />
            
          </div>
          
          {/* Game Info Bar - Responsive */}
          <div className={`${isMobile ? 'p-3' : 'p-4'} bg-dark-surface flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
            <div className={`flex ${isMobile ? 'justify-between w-full' : 'items-center gap-6'}`}>
              <div className="flex items-center gap-1 md:gap-2">
                <Coins className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{machineData?.price || roomInfo?.price || 0} coins</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Timer className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neon-cyan`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{timeRemaining}s</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Users className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neon-pink`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{Math.max(0, playerCount - 1)} watching</span>
              </div>
            </div>
            {queuePosition > 0 && (
              <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center mt-1' : ''}`}>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-400`}>Queue Position: {queuePosition}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* How to Play Section - Responsive */}
        {!isMobile && (
          <HowToPlay 
            gameName={machineData?.gameName || roomInfo?.gameName}
            machineName={machineData?.name || roomInfo?.machineName}
            price={machineData?.price || roomInfo?.price || 10}
          />
        )}
      </div>

      {/* Desktop Controls - Hidden on mobile */}
      {!isMobile && (
        <div className="lg:col-span-1">
          <div className="card-neon p-6 space-y-6">
            <h2 className="text-xl font-bold text-neon-cyan">Controls</h2>
            
            {/* Camera Switch Button - Always Available */}
            <button
              onClick={handleSwitchCamera}
              disabled={false}
              className="w-full px-4 py-3 bg-dark-surface hover:bg-neon-purple/20 
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
            
            {/* Game Management Panel */}
            <GameManagementPanel
              gameState={gameState}
              currentPlayerName={currentPlayerName}
              currentPlayerId={currentPlayerId}
              queuePosition={queuePosition}
              queueSize={queueSize}
              timeRemaining={timeRemaining}
              isWaitingForServer={isWaitingForServer}
              errorMessage={errorMessage}
              successMessage={successMessage}
              isConnected={isConnected}
              onStartGame={handleStartGame}
              onJoinQueue={handleJoinQueue}
              onLeaveQueue={handleLeaveQueue}
            />
            
            {/* Game Controls - Only show when playing */}
            {gameState === GameState.PLAYING && iAmPlaying && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-green">Game Controls</h3>
                <GameControls
                  machineName={machineData?.gameName || roomInfo?.gameName || machineData?.name || roomInfo?.machineName}
                  startContinuousMove={startContinuousMove}
                  stopContinuousMove={stopContinuousMove}
                  handleMove={handleMove}
                  disabled={false}
                />
                
                {/* Instructions */}
                <div className="p-4 bg-dark-surface/50 rounded-lg">
                  <p className="text-sm text-gray-400">
                    Use arrow keys to move the claw. Press CATCH to grab prizes!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  
  {/* Mobile Controls - Fixed at bottom */}
  {isMobile && (
    <MobileGameControls
      startContinuousMove={startContinuousMove}
      stopContinuousMove={stopContinuousMove}
      handleMove={handleMove}
      onSwitchCamera={handleSwitchCamera}
      disabled={gameState !== GameState.PLAYING || !iAmPlaying}
      currentCamera={currentCamera}
      gameState={gameState}
      currentPlayerName={currentPlayerName}
      queuePosition={queuePosition}
      queueSize={queueSize}
      timeRemaining={timeRemaining}
      isWaitingForServer={isWaitingForServer}
      errorMessage={errorMessage}
      successMessage={successMessage}
      isConnected={isConnected}
      onStartGame={handleStartGame}
      onJoinQueue={handleJoinQueue}
      onLeaveQueue={handleLeaveQueue}
    />
  )}
</div>
)
}
