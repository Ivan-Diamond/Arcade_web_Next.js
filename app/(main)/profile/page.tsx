'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Edit, MessageSquare, History, Coins, Trophy, Gamepad2, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { amplitudeService } from '@/lib/analytics/amplitude'
import { PROFILE_EVENTS } from '@/lib/analytics/events'
import { profileService } from '@/lib/api/services/profileService'
import { ProfileStats } from '@/lib/types/profile'

export default function ProfilePage() {
  const { data: session } = useSession()
  const { user: authUser, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'stats'>('overview')
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch profile statistics
  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!authUser) return
      
      try {
        setIsLoadingStats(true)
        setStatsError(null)
        const response = await profileService.getProfileStats()
        
        if (response.success && response.data) {
          setProfileStats(response.data)
        } else {
          setStatsError(response.error || 'Failed to load statistics')
        }
      } catch (error) {
        console.error('Error fetching profile stats:', error)
        setStatsError('Failed to load statistics')
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchProfileStats()
  }, [authUser])

  // Track profile page view
  useEffect(() => {
    amplitudeService.trackProfileEvent('PAGE_VIEWED', {
      user_level: (authUser as any)?.level || 1,
      user_coins: authUser?.coins || 0,
      total_wins: profileStats?.totalWins || 0,
      total_games: profileStats?.totalGames || 0
    })
  }, [profileStats])

  // Use real user data from session and profile stats
  const user = {
    id: authUser?.id || session?.user?.id || '',
    username: authUser?.username || session?.user?.username || 'Player',
    coins: authUser?.coins || 0,
    wins: profileStats?.totalWins || 0,
    gamesPlayed: profileStats?.totalGames || 0,
    winRate: profileStats?.winRate || 0,
    level: (authUser as any)?.level || 1, // Fixed TypeScript error
  }

  const handleLogout = async () => {
    // Track logout
    amplitudeService.trackProfileEvent('USER_LOGGED_OUT', {
      source: 'profile_page'
    })
    
    // Clear visitor-related localStorage items
    localStorage.removeItem('isVisitorAccount');
    localStorage.removeItem('visitorUsername');
    localStorage.removeItem('upgradingFromVisitor');
    
    await logout()
    router.push('/login')
  }

  const handleChangeName = () => {
    // Track name change attempt
    amplitudeService.trackProfileEvent('NAME_CHANGE_CLICKED', {})
    
    // TODO: Implement name change
    console.log('Change name clicked')
  }

  const handleFeedback = () => {
    // Track feedback click
    amplitudeService.trackProfileEvent('FEEDBACK_OPENED', {})
    
    // TODO: Implement feedback
    console.log('Feedback clicked')
  }

  const handleHistory = () => {
    // Track history view
    amplitudeService.trackProfileEvent('HISTORY_VIEWED', {})
    
    // Navigate to history page
    router.push('/history')
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Player Profile</h1>
        <p className="text-gray-400">Track your progress and achievements</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-neon border-2 border-neon-cyan mb-8"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-1">
              <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center">
                <User className="w-16 h-16 text-neon-cyan" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-dark-card border-2 border-neon-cyan rounded-full px-2 py-1">
              <span className="text-xs font-bold">LV.{user.level}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-xl font-semibold">{user.coins} coins</span>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {isLoadingStats ? (
                <>
                  <div className="text-center animate-pulse">
                    <div className="w-6 h-6 bg-gray-600 rounded mx-auto mb-1"></div>
                    <div className="h-6 bg-gray-600 rounded mb-1"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </div>
                  <div className="text-center animate-pulse">
                    <div className="w-6 h-6 bg-gray-600 rounded mx-auto mb-1"></div>
                    <div className="h-6 bg-gray-600 rounded mb-1"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </div>
                  <div className="text-center animate-pulse">
                    <div className="w-6 h-6 bg-gray-600 rounded mx-auto mb-1"></div>
                    <div className="h-6 bg-gray-600 rounded mb-1"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </div>
                </>
              ) : (
                <>
                  <StatItem icon={<Trophy />} value={user.wins} label="Wins" color="cyan" />
                  <StatItem icon={<Gamepad2 />} value={user.gamesPlayed} label="Games" color="purple" />
                  <StatItem icon={<TrendingUp />} value={`${user.winRate}%`} label="Win Rate" color="green" />
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <button
          onClick={handleLogout}
          className="card-neon border-red-500 hover:bg-red-500/10 flex flex-col items-center justify-center p-4 transition-all"
        >
          <LogOut className="w-6 h-6 text-red-500 mb-2" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
        
        <button
          onClick={handleChangeName}
          className="card-neon border-neon-cyan hover:bg-neon-cyan/10 flex flex-col items-center justify-center p-4 transition-all"
        >
          <Edit className="w-6 h-6 text-neon-cyan mb-2" />
          <span className="text-sm font-semibold">Change Name</span>
        </button>
        
        <button
          onClick={handleFeedback}
          className="card-neon border-neon-purple hover:bg-neon-purple/10 flex flex-col items-center justify-center p-4 transition-all"
        >
          <MessageSquare className="w-6 h-6 text-neon-purple mb-2" />
          <span className="text-sm font-semibold">Feedback</span>
        </button>
        
        <button
          onClick={handleHistory}
          className="card-neon border-neon-green hover:bg-neon-green/10 flex flex-col items-center justify-center p-4 transition-all"
        >
          <History className="w-6 h-6 text-neon-green mb-2" />
          <span className="text-sm font-semibold">History</span>
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex gap-2">
          {(['overview', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                // Track tab switch
                amplitudeService.trackProfileEvent('TAB_CHANGED', {
                  from_tab: activeTab,
                  to_tab: tab
                })
              }}
              className={`px-6 py-2 rounded-lg font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan'
                  : 'bg-dark-card text-gray-400 border-2 border-transparent hover:border-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailedStatCard title="Current Balance" icon={<Coins />} color="yellow">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-yellow-500">
                  {user.coins} coins
                </div>
                <p className="text-sm text-gray-400">Use coins to play games</p>
              </div>
            </DetailedStatCard>
            
            <DetailedStatCard title="Performance" icon={<Trophy />} color="cyan">
              <div className="space-y-3">
                {isLoadingStats ? (
                  <>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                    </div>
                  </>
                ) : statsError ? (
                  <div className="text-red-400 text-sm">
                    Failed to load statistics
                  </div>
                ) : (
                  <>
                    <StatRow label="Total Wins" value={user.wins} />
                    <StatRow label="Total Games" value={user.gamesPlayed} />
                    <StatRow label="Win Rate" value={`${user.winRate}%`} />
                  </>
                )}
              </div>
            </DetailedStatCard>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailedStatCard title="Games" icon={<Gamepad2 />} color="purple">
              <div className="space-y-3">
                {isLoadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                  </div>
                ) : statsError ? (
                  <div className="text-red-400 text-sm">Failed to load statistics</div>
                ) : (
                  <>
                    <StatRow label="Total Played" value={user.gamesPlayed} />
                    <StatRow label="Total Won" value={user.wins} />
                    <StatRow label="Win Rate" value={`${user.winRate}%`} />
                  </>
                )}
              </div>
            </DetailedStatCard>
            
            <DetailedStatCard title="Level" icon={<TrendingUp />} color="cyan">
              <div className="space-y-3">
                <div className="text-2xl font-bold text-neon-cyan">Level {user.level}</div>
                <p className="text-sm text-gray-400">Keep playing to level up!</p>
              </div>
            </DetailedStatCard>
            
            <DetailedStatCard title="Coins" icon={<Coins />} color="yellow">
              <div className="space-y-3">
                <div className="text-2xl font-bold text-yellow-500">{user.coins}</div>
                <p className="text-sm text-gray-400">Current balance</p>
              </div>
            </DetailedStatCard>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatItem({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode
  value: string | number
  label: string
  color: 'yellow' | 'cyan' | 'purple' | 'green'
}) {
  const colorClasses = {
    yellow: 'text-yellow-500',
    cyan: 'text-neon-cyan',
    purple: 'text-neon-purple',
    green: 'text-neon-green',
  }

  return (
    <div className="text-center">
      <div className={`${colorClasses[color]} mb-1`}>{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function DetailedStatCard({ 
  title, 
  icon, 
  color, 
  children 
}: { 
  title: string
  icon: React.ReactNode
  color: 'cyan' | 'yellow' | 'purple'
  children: React.ReactNode
}) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan',
    yellow: 'text-yellow-500 border-yellow-500',
    purple: 'text-neon-purple border-neon-purple',
  }

  return (
    <div className={`card-neon border-2 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={colorClasses[color]}>{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
