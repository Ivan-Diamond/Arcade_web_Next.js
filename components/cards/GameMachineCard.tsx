'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GameRoom } from '@/lib/types'
import { Users, Coins, Trophy, AlertCircle, Play } from 'lucide-react'

interface GameMachineCardProps {
  room: GameRoom
}

export default function GameMachineCard({ room }: GameMachineCardProps) {
  const router = useRouter()

  const statusColors = {
    available: 'border-neon-green text-neon-green',
    occupied: 'border-neon-purple text-neon-purple',
    maintenance: 'border-gray-500 text-gray-500',
  }

  const difficultyColors = {
    easy: 'bg-green-500/20 text-neon-green',
    medium: 'bg-purple-500/20 text-neon-purple',
    hard: 'bg-pink-500/20 text-neon-pink',
  }

  const handlePlay = () => {
    if (room.status === 'available') {
      router.push(`/room/${room.id}`)
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={item}
      whileHover={{ scale: room.status === 'available' ? 1.05 : 1 }}
      whileTap={{ scale: room.status === 'available' ? 0.95 : 1 }}
      className={`card-neon cursor-pointer border-2 ${statusColors[room.status]} transition-all duration-300`}
      onClick={handlePlay}
    >
      {/* Machine Image/Preview */}
      <div className="relative h-40 bg-gradient-to-br from-dark-surface to-dark-bg rounded-lg mb-4 overflow-hidden">
        {room.thumbnailUrl ? (
          <img 
            src={room.thumbnailUrl} 
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-16 h-16 text-gray-600" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${statusColors[room.status]} border`}>
          {room.status.toUpperCase()}
        </div>

        {/* Difficulty Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${difficultyColors[room.difficulty]}`}>
          {room.difficulty.toUpperCase()}
        </div>

        {/* Overlay for occupied/maintenance */}
        {room.status !== 'available' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            {room.status === 'occupied' ? (
              <div className="text-center">
                <Users className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                <p className="text-sm font-semibold">In Use</p>
                {room.currentPlayer && (
                  <p className="text-xs text-gray-400 mt-1">by {room.currentPlayer}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold">Under Maintenance</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Machine Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-lg mb-1">{room.name}</h3>
          {room.description && (
            <p className="text-sm text-gray-400 line-clamp-1">{room.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-300">{room.coinCost}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-neon-cyan" />
            <span className="text-gray-300">+{room.coinReward}</span>
          </div>
        </div>

        {/* Queue Info */}
        {room.queueLength > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{room.queueLength} in queue</span>
          </div>
        )}

        {/* Action Button */}
        {room.status === 'available' && (
          <button className="w-full btn-neon btn-neon-cyan py-2 text-sm flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            Play Now
          </button>
        )}
      </div>
    </motion.div>
  )
}
