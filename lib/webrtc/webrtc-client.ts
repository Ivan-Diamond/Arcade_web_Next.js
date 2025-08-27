import { io, Socket } from 'socket.io-client'

export class WebRTCClient {
  private socket: Socket | null = null
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private roomId: string | null = null
  private isInitiator: boolean = false

  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]

  constructor() {
    this.initialize()
  }

  private initialize() {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.setupSocketListeners()
  }

  private setupSocketListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebRTC Socket connected')
    })

    this.socket.on('offer', async (data: { offer: RTCSessionDescriptionInit, roomId: string }) => {
      if (data.roomId === this.roomId) {
        await this.handleOffer(data.offer)
      }
    })

    this.socket.on('answer', async (data: { answer: RTCSessionDescriptionInit, roomId: string }) => {
      if (data.roomId === this.roomId) {
        await this.handleAnswer(data.answer)
      }
    })

    this.socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit, roomId: string }) => {
      if (data.roomId === this.roomId) {
        await this.handleIceCandidate(data.candidate)
      }
    })

    this.socket.on('user-joined', (data: { roomId: string }) => {
      if (data.roomId === this.roomId && this.isInitiator) {
        this.createOffer()
      }
    })

    this.socket.on('user-left', () => {
      this.cleanup()
    })

    this.socket.on('disconnect', () => {
      console.log('WebRTC Socket disconnected')
      this.cleanup()
    })
  }

  async joinRoom(roomId: string, isHost: boolean = false): Promise<void> {
    this.roomId = roomId
    this.isInitiator = isHost

    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    })

    // Setup ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: this.roomId
        })
      }
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement
      if (remoteVideo) {
        remoteVideo.srcObject = this.remoteStream
      }
    }

    // Join the room via socket
    if (this.socket) {
      this.socket.emit('join-room', { roomId })
    }

    // If host, setup local stream (camera feed)
    if (isHost) {
      await this.setupLocalStream()
    }
  }

  private async setupLocalStream(): Promise<void> {
    try {
      // For claw machine, we might want to capture a specific video source
      // For now, using default camera
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        },
        audio: false // No audio for claw machine
      })

      const localVideo = document.getElementById('localVideo') as HTMLVideoElement
      if (localVideo) {
        localVideo.srcObject = this.localStream
      }

      // Add tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!)
        })
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return

    try {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      if (this.socket) {
        this.socket.emit('offer', {
          offer,
          roomId: this.roomId
        })
      }
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      if (this.socket) {
        this.socket.emit('answer', {
          answer,
          roomId: this.roomId
        })
      }
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  leaveRoom(): void {
    if (this.socket && this.roomId) {
      this.socket.emit('leave-room', { roomId: this.roomId })
    }
    this.cleanup()
  }

  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    // Clear video elements
    const localVideo = document.getElementById('localVideo') as HTMLVideoElement
    const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement
    
    if (localVideo) {
      localVideo.srcObject = null
    }
    
    if (remoteVideo) {
      remoteVideo.srcObject = null
    }

    this.remoteStream = null
    this.roomId = null
    this.isInitiator = false
  }

  disconnect(): void {
    this.cleanup()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected'
  }
}

// Singleton instance
let webRTCInstance: WebRTCClient | null = null

export const getWebRTCClient = (): WebRTCClient => {
  if (!webRTCInstance) {
    webRTCInstance = new WebRTCClient()
  }
  return webRTCInstance
}

export default WebRTCClient
