'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Coins, TrendingUp, Users } from 'lucide-react'
import { User } from '@/lib/types'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    // Mock leaderboard data
    const mockLeaderboard: User[] = [
      { id: '1', username: 'ProGamer123', coins: 15420, wins: 342, gamesPlayed: 892, winRate: 38.3, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', username: 'ArcadeMaster', coins: 12350, wins: 298, gamesPlayed: 765, winRate: 38.9, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', username: 'NeonKing', coins: 10890, wins: 256, gamesPlayed: 698, winRate: 36.7, createdAt: new Date(), updatedAt: new Date() },
      { id: '4', username: 'CyberPunk', coins: 9750, wins: 212, gamesPlayed: 612, winRate: 34.6, createdAt: new Date(), updatedAt: new Date() },
      { id: '5', username: 'PixelWarrior', coins: 8920, wins: 198, gamesPlayed: 589, winRate: 33.6, createdAt: new Date(), updatedAt: new Date() },
      { id: '6', username: 'GameWizard', coins: 7650, wins: 176, gamesPlayed: 542, winRate: 32.5, createdAt: new Date(), updatedAt: new Date() },
      { id: '7', username: 'RetroChamp', coins: 6890, wins: 154, gamesPlayed: 498, winRate: 30.9, createdAt: new Date(), updatedAt: new Date() },
      { id: '8', username: 'NightRider', coins: 5420, wins: 132, gamesPlayed: 456, winRate: 28.9, createdAt: new Date(), updatedAt: new Date() },
    ]
    
    setTimeout(() => {
      setLeaderboard(mockLeaderboard)
      setLoading(false)
    }, 1000)
  }, [timeFilter])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Award className="w-6 h-6 text-orange-600" />
      default: return <span className="w-6 text-center font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankGlow = (rank: number) => {
    switch (rank) {
      case 1: return 'border-yellow-500 shadow-yellow-500/30'
      case 2: return 'border-gray-400 shadow-gray-400/30'
      case 3: return 'border-orange-600 shadow-orange-600/30'
      default: return 'border-dark-border'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top players in the arcade</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="card-neon border-neon-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Players</p>
              <p className="text-2xl font-bold">2,543</p>
            </div>
            <Users className="w-8 h-8 text-neon-cyan" />
          </div>
        </div>
        <div className="card-neon border-neon-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Games Today</p>
              <p className="text-2xl font-bold">847</p>
            </div>
            <TrendingUp className="w-8 h-8 text-neon-purple" />
          </div>
        </div>
        <div className="card-neon border-neon-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Coins Earned</p>
              <p className="text-2xl font-bold">125.4K</p>
            </div>
            <Coins className="w-8 h-8 text-neon-green" />
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 mb-6"
      >
        {['all', 'week', 'month'].map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter as any)}
            className={`px-4 py-2 rounded-lg capitalize transition-all ${
              timeFilter === filter
                ? 'bg-neon-cyan text-black font-semibold'
                : 'bg-dark-surface text-gray-400 hover:text-white'
            }`}
          >
            {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-card rounded-xl overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading rankings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-surface border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {leaderboard.map((player, index) => {
                  const rank = index + 1
                  return (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`hover:bg-dark-surface transition-colors ${
                        rank <= 3 ? 'bg-gradient-to-r from-transparent to-transparent' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankIcon(rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-[2px] mr-3">
                            <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center text-sm font-bold">
                              {player.username[0].toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{player.username}</div>
                            <div className="text-xs text-gray-500">Level {Math.floor(player.wins / 10)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{player.coins.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {player.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {player.gamesPlayed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            player.winRate >= 35 ? 'text-neon-green' :
                            player.winRate >= 30 ? 'text-yellow-500' :
                            'text-gray-400'
                          }`}>
                            {player.winRate}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
