'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Home, 
  Gamepad2, 
  User, 
  Trophy, 
  LogOut, 
  Menu,
  X,
  Coins
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useState } from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, syncWithSession } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Sync with NextAuth session on mount
    const initAuth = async () => {
      await syncWithSession()
      setIsInitializing(false)
    }
    initAuth()
  }, [])

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router, isInitializing])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const navItems = [
    { href: '/lobby', label: 'Lobby', icon: Home },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-64 bg-dark-card border-r border-dark-border"
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <Link href="/lobby" className="block">
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">MSA</span>
              <span className="text-white ml-2">ARCADE</span>
            </h1>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-[2px]">
              <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center">
                <User className="w-6 h-6 text-neon-cyan" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user?.username}</p>
              <div className="flex items-center gap-1 text-sm text-yellow-500">
                <Coins className="w-3 h-3" />
                <span>{user?.coins || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                        : 'text-gray-400 hover:text-white hover:bg-dark-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-64 h-full bg-dark-card border-r border-dark-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile sidebar content - same as desktop */}
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">MSA</span>
                <span className="text-white ml-2">ARCADE</span>
              </h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-[2px]">
                  <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center">
                    <User className="w-6 h-6 text-neon-cyan" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user?.username}</p>
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Coins className="w-3 h-3" />
                    <span>{user?.coins || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                            : 'text-gray-400 hover:text-white hover:bg-dark-surface'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="p-4 border-t border-dark-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-dark-card border-b border-dark-border p-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold gradient-text">MSA ARCADE</h1>
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            <Coins className="w-4 h-4" />
            <span>{user?.coins || 0}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
