'use client'

import { useState } from 'react'
// Simple button component since ui/button doesn't exist yet
const Button = ({ onClick, children, variant = 'default', className = '' }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded font-semibold transition-all ${
      variant === 'outline' 
        ? 'border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20' 
        : 'bg-neon-cyan text-black hover:bg-neon-cyan/80'
    } ${className}`}
  >
    {children}
  </button>
)

export default function WebRTCTestPage() {
  const [log, setLog] = useState<string[]>([])
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLog(prev => [...prev, `[${timestamp}] ${type.toUpperCase()}: ${message}`])
  }

  const testDirectConnection = async () => {
    try {
      addLog('Fetching actual machine camera URLs...')
      
      // First get the actual camera URLs from the API
      const response = await fetch('/api/lobby')
      const data = await response.json()
      
      if (!data.data?.machines || data.data.machines.length === 0) {
        addLog('No machines found in API', 'error')
        return
      }

      // Get camera URLs from actual machine data
      const cameraUrls: string[] = []
      data.data.machines.forEach((machine: any) => {
        if (machine.camera0Url) cameraUrls.push(machine.camera0Url)
        if (machine.camera1Url) cameraUrls.push(machine.camera1Url)
      })

      if (cameraUrls.length === 0) {
        addLog('No camera URLs found in machine data', 'error')
        return
      }

      addLog(`Found ${cameraUrls.length} camera URLs to test`, 'success')

      for (const rtmpUrl of cameraUrls.slice(0, 5)) { // Test first 5 URLs
        addLog(`Testing URL: ${rtmpUrl}`)
        
        const url = new URL(rtmpUrl)
        const api = `http://${url.hostname}:1985/rtc/v1/play/`
        const streamUrl = `webrtc://${url.hostname}${url.pathname}`
        
        addLog(`API: ${api}`)
        addLog(`Stream: ${streamUrl}`)

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })

        // Add transceivers for receive-only
        pc.addTransceiver('audio', { direction: 'recvonly' })
        pc.addTransceiver('video', { direction: 'recvonly' })

        // Set up event handlers
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addLog(`ICE candidate: ${event.candidate.candidate}`)
          }
        }

        pc.ontrack = (event) => {
          addLog(`Track received: ${event.track.kind}`, 'success')
          if (videoElement && event.streams?.[0]) {
            videoElement.srcObject = event.streams[0]
            addLog('Video stream attached!', 'success')
          }
        }

        // Create offer
        const offer = await pc.createOffer()
        offer.sdp = offer.sdp?.replace('profile-level-id=640c1f', 'profile-level-id=42e032')
        await pc.setLocalDescription(offer)

        const data = {
          api: api,
          streamurl: streamUrl,
          sdp: offer.sdp
        }

        try {
          const response = await fetch(api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (response.ok) {
            const result = await response.json()
            if (result.sdp) {
              addLog('SDP answer received!', 'success')
              const answer = new RTCSessionDescription({ type: 'answer', sdp: result.sdp })
              await pc.setRemoteDescription(answer)
              addLog('WebRTC connection established!', 'success')
              return // Success - stop trying other URLs
            }
          } else {
            addLog(`Failed: ${response.status}`, 'error')
          }
        } catch (e: any) {
          addLog(`Connection error: ${e.message}`, 'error')
        }
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`, 'error')
    }
  }

  const testProxiedConnection = async () => {
    try {
      // Test through proxy
      const rtmpUrl = 'rtmp://206.81.25.143:1935/live/104_0'
      const url = new URL(rtmpUrl)
      
      // Use proxied endpoint
      const api = '/rtc/v1/play/'
      const streamUrl = `webrtc://${url.hostname}${url.pathname}`
      
      addLog(`Testing proxied connection`)
      addLog(`API: ${api}`)
      addLog(`Stream: ${streamUrl}`)

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      pc.addTransceiver('audio', { direction: 'recvonly' })
      pc.addTransceiver('video', { direction: 'recvonly' })

      pc.ontrack = (event) => {
        addLog(`Track received: ${event.track.kind}`, 'success')
        if (videoElement && event.streams?.[0]) {
          videoElement.srcObject = event.streams[0]
          addLog('Video stream attached!', 'success')
        }
      }

      const offer = await pc.createOffer()
      offer.sdp = offer.sdp?.replace('profile-level-id=640c1f', 'profile-level-id=42e032')
      await pc.setLocalDescription(offer)

      const data = {
        api: `http://${url.hostname}:1985/rtc/v1/play/`,
        streamurl: streamUrl,
        sdp: offer.sdp
      }

      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const responseText = await response.text()
      addLog(`Response status: ${response.status}`)
      addLog(`Response: ${responseText.substring(0, 200)}...`)

      if (response.ok) {
        const result = JSON.parse(responseText)
        if (result.sdp) {
          const answer = new RTCSessionDescription({ type: 'answer', sdp: result.sdp })
          await pc.setRemoteDescription(answer)
          addLog('WebRTC connection established via proxy!', 'success')
        }
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`, 'error')
    }
  }

  const testMachineData = async () => {
    try {
      addLog('Fetching machine data from API...')
      const response = await fetch('/api/lobby')
      const data = await response.json()
      
      if (data.code === 20000 && data.data?.machines) {
        addLog(`Found ${data.data.machines.length} machines`, 'success')
        
        data.data.machines.slice(0, 3).forEach((machine: any) => {
          addLog(`Machine ${machine.macNo}:`)
          addLog(`  Name: ${machine.gameName}`)
          addLog(`  Camera0: ${machine.camera0Url || 'undefined'}`)
          addLog(`  Camera1: ${machine.camera1Url || 'undefined'}`)
          addLog(`  Status: ${machine.netStatus === 1 ? 'Online' : 'Offline'}`)
        })
      } else {
        addLog('No machine data found', 'error')
      }
    } catch (e: any) {
      addLog(`Error fetching machine data: ${e.message}`, 'error')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-neon-cyan">WebRTC Debug Console</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="space-y-4 mb-6">
            <Button onClick={testMachineData} className="w-full">
              1. Test Machine Data API
            </Button>
            <Button onClick={testDirectConnection} className="w-full">
              2. Test Direct Connection (Port 1985)
            </Button>
            <Button onClick={testProxiedConnection} className="w-full">
              3. Test Proxied Connection
            </Button>
            <Button onClick={() => setLog([])} variant="outline" className="w-full">
              Clear Log
            </Button>
          </div>

          <div className="bg-black/50 border border-neon-cyan/30 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2 text-neon-pink">Video Preview</h2>
            <video 
              ref={(el) => setVideoElement(el)}
              autoPlay 
              playsInline 
              muted
              className="w-full bg-gray-900 rounded"
              style={{ height: '300px' }}
            />
          </div>
        </div>

        <div className="bg-black/50 border border-neon-cyan/30 rounded-lg p-4 h-[600px] overflow-y-auto">
          <h2 className="text-xl font-bold mb-2 text-neon-pink">Console Log</h2>
          <div className="font-mono text-xs space-y-1">
            {log.map((entry, i) => (
              <div 
                key={i} 
                className={
                  entry.includes('ERROR') ? 'text-red-400' :
                  entry.includes('SUCCESS') ? 'text-green-400' :
                  'text-cyan-300'
                }
              >
                {entry}
              </div>
            ))}
            {log.length === 0 && (
              <div className="text-gray-500">No logs yet. Click a test button to start.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
