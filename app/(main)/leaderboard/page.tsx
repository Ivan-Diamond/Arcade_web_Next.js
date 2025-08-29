'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Coins } from 'lucide-react'

interface RankData {
  user_id: number
  headimg: string
  name: string
  title: string
  cnt: number
  winAmount?: number
}

export default function LeaderboardPage() {
  const [rankingsByWins, setRankingsByWins] = useState<RankData[]>([])
  const [rankingsByCoins, setRankingsByCoins] = useState<RankData[]>([])
  const [activeTab, setActiveTab] = useState<'wins' | 'coins'>('wins')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/app/api/rankings')
        const data = await response.json()
        
        if (data.data?.byWins && data.data?.byCoins) {
          setRankingsByWins(data.data.byWins)
          setRankingsByCoins(data.data.byCoins)
        } else if (data.code === 20000 && data.data) {
          // Fallback for old format
          setRankingsByWins(data.data)
          setRankingsByCoins(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])
  
  const rankings = activeTab === 'wins' ? rankingsByWins : rankingsByCoins

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Award className="w-6 h-6 text-orange-600" />
      default: return <span className="w-6 text-center font-bold text-gray-500">#{rank}</span>
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
        <p className="text-gray-400">Top winners in the arcade</p>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        <button
          onClick={() => setActiveTab('wins')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'wins'
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white'
              : 'bg-dark-card text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Most Wins
          </div>
        </button>
        <button
          onClick={() => setActiveTab('coins')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'coins'
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white'
              : 'bg-dark-card text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Most Coins
          </div>
        </button>
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
        ) : rankings.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No rankings available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-surface border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'wins' ? 'Total Wins' : 'Coins Won'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {rankings.map((player, index) => {
                  const rank = index + 1
                  return (
                    <motion.tr
                      key={player.user_id}
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
                              {player.headimg ? (
                                <img src={player.headimg} alt={player.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                player.name[0]?.toUpperCase() || '?'
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{player.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-400">{player.title || 'Player'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {activeTab === 'wins' ? (
                            <>
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="font-semibold">{player.cnt}</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4 text-yellow-500" />
                              <span className="font-semibold">{player.winAmount || 0}</span>
                            </>
                          )}
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
