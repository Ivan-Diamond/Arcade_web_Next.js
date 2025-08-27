'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Gamepad2, Users, Clock, Coins } from 'lucide-react'
import { GameRoom } from '@/lib/types'
import GameMachineCard from '@/components/cards/GameMachineCard'

export default function GamesPage() {
  const [games, setGames] = useState<GameRoom[]>([])
  const [filteredGames, setFilteredGames] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all')

  useEffect(() => {
    // Mock games data
    const mockGames: GameRoom[] = [
      {
        id: '1',
        name: 'Neon Crane Master',
        description: 'Classic claw machine with neon prizes',
        status: 'available',
        streamUrl: '',
        thumbnailUrl: '/images/crane1.jpg',
        queueLength: 0,
        difficulty: 'medium',
        coinCost: 15,
        coinReward: 75,
      },
      {
        id: '2',
        name: 'Cyber Basketball',
        description: 'Shoot hoops in cyberpunk style',
        status: 'occupied',
        streamUrl: '',
        thumbnailUrl: '/images/basketball.jpg',
        queueLength: 3,
        difficulty: 'easy',
        coinCost: 10,
        coinReward: 50,
      },
      {
        id: '3',
        name: 'Retro Racing Pro',
        description: 'High-speed arcade racing action',
        status: 'available',
        streamUrl: '',
        thumbnailUrl: '/images/racing.jpg',
        queueLength: 0,
        difficulty: 'hard',
        coinCost: 25,
        coinReward: 125,
      },
      {
        id: '4',
        name: 'Pixel Plush Paradise',
        description: 'Win adorable pixel art plushies',
        status: 'available',
        streamUrl: '',
        thumbnailUrl: '/images/plush.jpg',
        queueLength: 0,
        difficulty: 'easy',
        coinCost: 10,
        coinReward: 45,
      },
      {
        id: '5',
        name: 'Neon Ninja Claw',
        description: 'Advanced claw machine with special moves',
        status: 'occupied',
        streamUrl: '',
        thumbnailUrl: '/images/ninja.jpg',
        queueLength: 5,
        difficulty: 'hard',
        coinCost: 30,
        coinReward: 150,
      },
      {
        id: '6',
        name: 'Crystal Catcher',
        description: 'Catch glowing crystals for big rewards',
        status: 'available',
        streamUrl: '',
        thumbnailUrl: '/images/crystal.jpg',
        queueLength: 0,
        difficulty: 'medium',
        coinCost: 20,
        coinReward: 100,
      },
    ]

    setTimeout(() => {
      setGames(mockGames)
      setFilteredGames(mockGames)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...games]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(game => game.difficulty === difficultyFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => game.status === statusFilter)
    }

    setFilteredGames(filtered)
  }, [searchQuery, difficultyFilter, statusFilter, games])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">All Games</h1>
        <p className="text-gray-400">Browse and filter arcade machines</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Games</p>
              <p className="text-xl font-bold">{games.length}</p>
            </div>
            <Gamepad2 className="w-6 h-6 text-neon-cyan" />
          </div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Available</p>
              <p className="text-xl font-bold text-neon-green">
                {games.filter(g => g.status === 'available').length}
              </p>
            </div>
            <Clock className="w-6 h-6 text-neon-green" />
          </div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">In Queue</p>
              <p className="text-xl font-bold text-yellow-500">
                {games.reduce((acc, g) => acc + g.queueLength, 0)}
              </p>
            </div>
            <Users className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Avg. Cost</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                {Math.round(games.reduce((acc, g) => acc + g.coinCost, 0) / games.length || 0)}
              </p>
            </div>
            <Coins className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-card rounded-xl p-4 mb-8 border border-dark-border"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-surface rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficultyFilter(level)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  difficultyFilter === level
                    ? 'bg-neon-purple text-white font-semibold'
                    : 'bg-dark-surface text-gray-400 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'available', 'occupied'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-neon-cyan text-black font-semibold'
                    : 'bg-dark-surface text-gray-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Games Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading games...</p>
          </div>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No games found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <GameMachineCard room={game} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
