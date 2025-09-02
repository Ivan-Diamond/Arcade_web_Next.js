'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Coins, Trophy, Clock, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { historyService } from '@/lib/api/services/historyService'
import { GameRecord, GameHistoryResponse } from '@/lib/types'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { amplitudeService } from '@/lib/analytics/amplitude'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 100000 // Large size to get most/all records

  useEffect(() => {
    // Track page view
    amplitudeService.trackProfileEvent('HISTORY_VIEWED', {})
    fetchGameHistory(1) // Start with UI page 1
  }, [])

  const fetchGameHistory = async (uiPage: number) => {
    if (!user) {
      setError('Please log in to view your game history')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert UI page (1-based) to backend page (0-based)
      const backendPage = uiPage - 1
      const response = await historyService.getGameHistory(backendPage, pageSize)
      
      if (response.success && response.data) {
        setGameHistory(response.data.records)
        setTotalPages(response.data.pagination.totalPages)
        setCurrentPage(uiPage) // Store UI page (1-based)
      } else {
        setError(response.error || 'Failed to load game history')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error fetching game history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      amplitudeService.trackProfileEvent('HISTORY_VIEWED', {})
      fetchGameHistory(newPage) // Pass UI page (1-based)
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'text-green-500'
      case 'lose':
        return 'text-red-500'
      case 'timeout':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return (
          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
            WIN
          </span>
        )
      case 'lose':
        return (
          <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
            LOSE
          </span>
        )
      case 'timeout':
        return (
          <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
            TIMEOUT
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">
            PENDING
          </span>
        )
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Game History</h1>
            </div>
            <p className="mt-2 text-white/70">View your past games and results</p>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white"
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Game History List */}
        {!isLoading && !error && gameHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {gameHistory.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {record.machineName}
                      </h3>
                      {getResultBadge(record.result)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(record.startTime), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(record.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Coins Info */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-sm text-white/60">Spent</p>
                      <p className="text-lg font-semibold text-red-400 flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {record.coinsSpent}
                      </p>
                    </div>
                    {record.result === 'win' && record.coinsEarned > 0 && (
                      <div className="text-center">
                        <p className="text-sm text-white/60">Earned</p>
                        <p className="text-lg font-semibold text-green-400 flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          +{record.coinsEarned}
                        </p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm text-white/60">Net</p>
                      <p className={`text-lg font-semibold flex items-center gap-1 ${
                        record.coinsEarned - record.coinsSpent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <Coins className="w-4 h-4" />
                        {record.coinsEarned - record.coinsSpent > 0 ? '+' : ''}
                        {record.coinsEarned - record.coinsSpent}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && gameHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <History className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No games played yet</h3>
            <p className="text-white/60">Start playing to see your game history here!</p>
            <button
              onClick={() => router.push('/lobby')}
              className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Lobby
            </button>
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-center items-center gap-4"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
