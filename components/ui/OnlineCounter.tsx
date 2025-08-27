'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { socketClient } from '@/lib/socket/socket-client'

export function OnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect to socket
    socketClient.connect()

    // Listen for online count updates
    const handleOnlineCount = (count: number) => {
      setOnlineCount(count)
    }

    const handleConnect = () => {
      setIsConnected(true)
      socketClient.emit('get-online-count')
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setOnlineCount(0)
    }

    // Set up event listeners
    socketClient.on('online-count', handleOnlineCount)
    socketClient.on('connect', handleConnect)
    socketClient.on('disconnect', handleDisconnect)

    // Request initial count
    if (socketClient.isConnected()) {
      socketClient.emit('get-online-count')
    }

    return () => {
      socketClient.off('online-count', handleOnlineCount)
      socketClient.off('connect', handleConnect)
      socketClient.off('disconnect', handleDisconnect)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-dark-card rounded-lg border border-dark-border">
      <div className="relative">
        <Users className="w-5 h-5 text-neon-cyan" />
        {isConnected && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">Online Now</span>
        <span className="text-sm font-bold text-neon-cyan">
          {onlineCount.toLocaleString()} {onlineCount === 1 ? 'Player' : 'Players'}
        </span>
      </div>
    </div>
  )
}
