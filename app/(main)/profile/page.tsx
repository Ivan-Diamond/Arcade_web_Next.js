'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Trophy, Coins, Target, TrendingUp, Calendar, Award, Gamepad2 } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats')

  // Mock user data
  const user = {
    id: '1',
    username: 'CyberPlayer',
    avatar: '',
    coins: 1250,
    wins: 42,
    gamesPlayed: 156,
    winRate: 26.9,
    joinDate: '2024-01-15',
    level: 12,
    nextLevelProgress: 65,
  }

  const recentGames = [
    { id: '1', machine: 'Neon Crane Master', result: 'win', coins: 50, date: '2024-12-20' },
    { id: '2', machine: 'Cyber Claw Extreme', result: 'lose', coins: -20, date: '2024-12-19' },
    { id: '3', machine: 'Lucky Fortune', result: 'win', coins: 75, date: '2024-12-19' },
    { id: '4', machine: 'Retro Arcade', result: 'lose', coins: -10, date: '2024-12-18' },
  ]

  const achievements = [
    { id: '1', name: 'First Win', description: 'Win your first game', icon: Trophy, unlocked: true, color: 'cyan' },
    { id: '2', name: 'Coin Master', description: 'Earn 1000 coins', icon: Coins, unlocked: true, color: 'yellow' },
    { id: '3', name: 'Sharpshooter', description: 'Win 5 games in a row', icon: Target, unlocked: false, color: 'purple' },
    { id: '4', name: 'Veteran', description: 'Play 100 games', icon: Award, unlocked: true, color: 'green' },
  ]

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
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.username} width={120} height={120} className="rounded-full" />
                ) : (
                  <User className="w-16 h-16 text-neon-cyan" />
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-dark-card border-2 border-neon-cyan rounded-full px-2 py-1">
              <span className="text-xs font-bold">LV.{user.level}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
            <p className="text-gray-400 mb-4">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
            
            {/* Level Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Level {user.level}</span>
                <span className="text-gray-400">{user.nextLevelProgress}%</span>
              </div>
              <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-500"
                  style={{ width: `${user.nextLevelProgress}%` }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem icon={<Coins />} value={user.coins} label="Coins" color="yellow" />
              <StatItem icon={<Trophy />} value={user.wins} label="Wins" color="cyan" />
              <StatItem icon={<Gamepad2 />} value={user.gamesPlayed} label="Games" color="purple" />
              <StatItem icon={<TrendingUp />} value={`${user.winRate}%`} label="Win Rate" color="green" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex gap-2">
          {(['stats', 'history', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailedStatCard title="Performance" icon={<TrendingUp />} color="cyan">
              <div className="space-y-3">
                <StatRow label="Total Wins" value={user.wins} />
                <StatRow label="Total Games" value={user.gamesPlayed} />
                <StatRow label="Win Rate" value={`${user.winRate}%`} />
                <StatRow label="Best Streak" value="7 wins" />
              </div>
            </DetailedStatCard>
            
            <DetailedStatCard title="Economy" icon={<Coins />} color="yellow">
              <div className="space-y-3">
                <StatRow label="Current Balance" value={`${user.coins} coins`} />
                <StatRow label="Total Earned" value="5,420 coins" />
                <StatRow label="Total Spent" value="4,170 coins" />
                <StatRow label="Avg. per Game" value="35 coins" />
              </div>
            </DetailedStatCard>
            
            <DetailedStatCard title="Activity" icon={<Calendar />} color="purple">
              <div className="space-y-3">
                <StatRow label="Days Active" value="45 days" />
                <StatRow label="Games Today" value="3" />
                <StatRow label="Best Day" value="12 games" />
                <StatRow label="Current Streak" value="5 days" />
              </div>
            </DetailedStatCard>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {recentGames.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-neon flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    game.result === 'win' ? 'bg-green-500/20 text-neon-green' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{game.machine}</p>
                    <p className="text-sm text-gray-400">{game.date}</p>
                  </div>
                </div>
                <div className={`font-bold ${
                  game.coins > 0 ? 'text-neon-green' : 'text-red-400'
                }`}>
                  {game.coins > 0 ? '+' : ''}{game.coins} coins
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              const colorClasses = {
                cyan: 'text-neon-cyan border-neon-cyan',
                yellow: 'text-yellow-500 border-yellow-500',
                purple: 'text-neon-purple border-neon-purple',
                green: 'text-neon-green border-neon-green',
              }
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`card-neon border-2 ${
                    achievement.unlocked 
                      ? colorClasses[achievement.color as keyof typeof colorClasses]
                      : 'border-gray-600 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      achievement.unlocked 
                        ? `bg-${achievement.color}-500/20` 
                        : 'bg-gray-700/20'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{achievement.name}</h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
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
