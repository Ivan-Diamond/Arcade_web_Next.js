'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Circle, X, Volume2, VolumeX, Wifi, WifiOff,
  Coins, Timer, Users
} from 'lucide-react'
import ProtobufSocketClient, { WawaOptEnum } from '@/lib/socket/protobuf-socket-client'
import { WebRTCSignaling } from '@/lib/webrtc/signaling'
import { roomService } from '@/lib/api/room-service'

export default function GameRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const macNo = params.macNo as string
  
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [currentCamera, setCurrentCamera] = useState<0 | 1>(0)
  const [machineData, setMachineData] = useState<any>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const signalingRef = useRef<WebRTCSignaling | null>(null)
  const socketClientRef = useRef<ProtobufSocketClient | null>(null)

  // Initialize WebRTC immediately with known camera patterns
  useEffect(() => {
    // Start WebRTC immediately with all known camera server patterns
    const initializeImmediately = async () => {
      console.log('Attempting immediate WebRTC connection for machine:', macNo)
      
      // All known camera server IPs and patterns
      const possibleUrls = [
        // Main camera servers
        `rtmp://206.81.25.143:1935/live/${macNo}_0`,
        `rtmp://206.81.25.143:1935/live/${macNo}_1`,
        `rtmp://46.101.131.181:1935/live/${macNo}_0`, 
        `rtmp://46.101.131.181:1935/live/${macNo}_1`,
        
        // Alternative patterns for animated machines
        `rtmp://www.xbdoll.cn:1935/live/${macNo}_0`,
        `rtmp://www.xbdoll.cn:1935/live/${macNo}_1`,
        `rtmp://www.xbdoll.cn:1935/live/${macNo}`,
        
        // Numeric patterns
        `rtmp://206.81.25.143:1935/live/${macNo}`,
        `rtmp://46.101.131.181:1935/live/${macNo}`,
        
        // Try without underscores for some machines
        `rtmp://206.81.25.143:1935/live/${macNo}0`,
        `rtmp://206.81.25.143:1935/live/${macNo}1`,
        
        // Other possible server IPs
        `rtmp://104.248.143.207:1935/live/${macNo}_0`,
        `rtmp://104.248.143.207:1935/live/${macNo}_1`,
      ]
      
      // Try each URL until one succeeds
      for (const url of possibleUrls) {
        try {
          console.log('Trying:', url)
          await initializeWebRTC(url)
          console.log('SUCCESS! Connected to:', url)
          return // Exit on first success
        } catch (error) {
          console.log('Failed:', url, error.message)
        }
      }
      
      console.log('All immediate connection attempts failed')
    }
    
    initializeImmediately()
    
    // Also fetch machine data for accurate info (but don't wait for it)
    const fetchMachineData = async () => {
      if (!session?.jwt) return
      
      try {
        const data = await roomService.getLobbyData()
        if (data?.machines) {
          const machine = data.machines.find((m: any) => m.macNo === macNo)
          if (machine) {
            setMachineData(machine)
            // If we have actual camera URLs and they're different, update the stream
            const cameraUrl = machine.camera0Url || machine.camera1Url
            if (cameraUrl && signalingRef.current) {
              // Reconnect with correct URL if needed
              console.log('Updating to actual camera URL:', cameraUrl)
              await initializeWebRTC(cameraUrl)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch machine data:', error)
      }
    }
    
    fetchMachineData()
  }, [session, macNo])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user?.id || !(session as any)?.socketPassword) return

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

    client.onPlayerCount = (count) => {
      setPlayerCount(count)
    }

    client.onEnterRoomResult = (data) => {
      console.log('Enter room result:', data)
      setRoomInfo(data)
      // Don't initialize WebRTC here - it's already done with machine data
    }

    client.onGameResult = (result) => {
      console.log('Game result:', result)
      setGameStatus('ended')
      // Show result message
      setTimeout(() => {
        setGameStatus('waiting')
      }, 5000)
    }

    // Connect to server
    client.connect(session.user?.id || '', (session as any).socketPassword, macNo)

    return () => {
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
    if (!isConnected || !socketClientRef.current) return
    
    let wawaOpt: WawaOptEnum
    switch(action) {
      case 'UP':
        wawaOpt = WawaOptEnum.UP
        break
      case 'DOWN':
        wawaOpt = WawaOptEnum.DOWN
        break
      case 'LEFT':
        wawaOpt = WawaOptEnum.LEFT
        break
      case 'RIGHT':
        wawaOpt = WawaOptEnum.RIGHT
        break
      case 'CATCH':
        wawaOpt = WawaOptEnum.GRAB
        break
      default:
        return
    }
    
    socketClientRef.current.sendWawaMove(wawaOpt)
  }

  const handleStartGame = () => {
    if (!socketClientRef.current || !isConnected) return
    
    console.log('Starting game...')
    socketClientRef.current.startGame()
    setGameStatus('playing')
    setTimeRemaining(30)
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameStatus('ended')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleExitRoom = () => {
    if (socketClientRef.current) {
      socketClientRef.current.exitRoom()
    }
    router.push('/lobby')
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neon-cyan">
              Machine #{macNo}
            </h1>
            <p className="text-gray-400 text-sm">
              {roomInfo?.gameName || 'Loading...'}
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <p className="text-neon-cyan mb-4">Ready to play?</p>
                      <button
                        onClick={handleStartGame}
                        className="btn-neon px-8 py-3"
                      >
                        Start Game
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Info Bar */}
              <div className="p-4 bg-dark-surface flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">Cost: {roomInfo?.price || 10} coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-neon-cyan" />
                    <span className="text-sm">{timeRemaining}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-pink" />
                    <span className="text-sm">{roomInfo?.playerNum || 0} watching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="card-neon p-6">
              <h2 className="text-xl font-bold mb-6 text-neon-cyan">Controls</h2>
              
              {/* D-Pad */}
              <div className="relative w-48 h-48 mx-auto mb-8">
                {/* Up */}
                <button
                  onMouseDown={() => handleControl('DOWN')}
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
                  onMouseDown={() => handleControl('UP')}
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
                  onMouseDown={() => handleControl('LEFT')}
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
                  onMouseDown={() => handleControl('RIGHT')}
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
                onMouseDown={() => handleControl('CATCH')}
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
    </div>
  )
}
