'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Gamepad2, Users, Trophy, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-purple rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-cyan rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neon-pink rounded-full opacity-20 blur-3xl animate-pulse" />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-bold font-cyber mb-4">
            <span className="gradient-text">MSA</span>
            <span className="text-white ml-4">ARCADE</span>
          </h1>
          <p className="text-xl text-neon-cyan animate-pulse">Online Claw Machine Experience</p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
        >
          <FeatureCard
            icon={<Gamepad2 className="w-8 h-8" />}
            title="Real Machines"
            description="Play with actual claw machines via live streaming"
            color="cyan"
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Win Coins"
            description="Earn virtual coins with every successful grab"
            color="purple"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Compete"
            description="Climb the leaderboard and become a champion"
            color="pink"
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/login">
            <button className="btn-neon btn-neon-cyan px-8 py-4 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Start Playing
            </button>
          </Link>
          <Link href="/register">
            <button className="btn-neon btn-neon-purple px-8 py-4 text-lg">
              Create Account
            </button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <StatItem value="10K+" label="Players" />
          <StatItem value="50+" label="Machines" />
          <StatItem value="24/7" label="Available" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  color: 'cyan' | 'purple' | 'pink'
}) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan hover:shadow-neon-cyan',
    purple: 'text-neon-purple border-neon-purple hover:shadow-neon-purple',
    pink: 'text-neon-pink border-neon-pink hover:shadow-neon-pink',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`card-neon border-2 ${colorClasses[color]} transition-all duration-300 hover:bg-opacity-10`}
    >
      <div className={`mb-4 ${colorClasses[color]}`}>{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold gradient-text">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  )
}
