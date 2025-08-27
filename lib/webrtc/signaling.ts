export class WebRTCSignaling {
  private pc: RTCPeerConnection | null = null
  private remoteStream: MediaStream | null = null

  constructor() {}

  async pullStream(rtmpUrl: string): Promise<MediaStream> {
    // Create peer connection with STUN servers
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Add transceivers for receive-only audio and video
    this.pc.addTransceiver('audio', { direction: 'recvonly' })
    this.pc.addTransceiver('video', { direction: 'recvonly' })

    // Set up track handler
    this.pc.ontrack = (event) => {
      console.log('Received track:', event.track.kind)
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0]
      }
    }

    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.pc?.iceConnectionState)
    }

    // Create offer and start signaling immediately
    await this.createOffer(rtmpUrl)
    
    // Return a dummy MediaStream immediately for the video element
    // The actual stream will be set when tracks arrive
    if (!this.remoteStream) {
      this.remoteStream = new MediaStream()
    }
    
    return this.remoteStream
  }

  private async createOffer(rtmpUrl: string) {
    if (!this.pc) throw new Error('PeerConnection not initialized')
    
    // Validate URL before proceeding
    if (!rtmpUrl || rtmpUrl === 'undefined' || rtmpUrl === 'null') {
      throw new Error(`Invalid RTMP URL: ${rtmpUrl}`)
    }

    console.log('Creating WebRTC offer for URL:', rtmpUrl)

    // Create offer with constraints
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    })

    // Fix SDP profile level for better compatibility
    offer.sdp = offer.sdp?.replace(
      'profile-level-id=640c1f',
      'profile-level-id=42e032'
    )

    await this.pc.setLocalDescription(offer)

    // Parse RTMP URL to get camera server IP
    let url: URL
    try {
      url = new URL(rtmpUrl)
    } catch (e) {
      console.error('Failed to parse URL:', rtmpUrl, e)
      throw new Error(`Invalid URL format: ${rtmpUrl}`)
    }
    
    // Always use the camera server IP from the RTMP URL
    const cameraServerIP = url.hostname
    const streamPath = url.pathname
    
    console.log('Camera server IP:', cameraServerIP)
    console.log('Stream path:', streamPath)
    
    // Different servers might use different ports or endpoints
    let signalingUrl: string
    let streamUrl: string
    
    if (cameraServerIP === 'www.xbdoll.cn') {
      // Animated machines might use different port or endpoint
      signalingUrl = `http://${cameraServerIP}:1985/rtc/v1/play/`
      streamUrl = `webrtc://${cameraServerIP}${streamPath}`
      console.log('Using animated machine configuration')
    } else {
      // Standard configuration for main servers
      signalingUrl = `http://${cameraServerIP}:1985/rtc/v1/play/`
      streamUrl = `webrtc://${cameraServerIP}${streamPath}`
    }

    console.log('RTMP URL:', rtmpUrl)
    console.log('Signaling URL:', signalingUrl)
    console.log('Stream URL:', streamUrl)

    // Try direct connection first (works in many browsers)
    let response: Response
    try {
      console.log('Attempting direct connection to camera server...')
      response = await fetch(signalingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api: signalingUrl,
          streamurl: streamUrl,
          sdp: offer.sdp,
        }),
      })
      console.log('Direct connection successful!')
    } catch (error) {
      console.log('Direct connection failed, using proxy...', error)
      // Fallback to proxy if direct connection fails
      response = await fetch('/api/webrtc/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraServerIP: cameraServerIP,
          api: signalingUrl,
          streamurl: streamUrl,
          sdp: offer.sdp,
        }),
      })
    }

    if (!response.ok) {
      throw new Error(`Signaling failed: ${response.status}`)
    }

    const data = await response.json()
    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: data.sdp,
    })

    await this.pc.setRemoteDescription(answer)
    console.log('WebRTC connection established')
  }

  async switchCamera(newRtmpUrl: string): Promise<MediaStream> {
    this.disconnect()
    return this.pullStream(newRtmpUrl)
  }

  disconnect() {
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
    this.remoteStream = null
  }
}
