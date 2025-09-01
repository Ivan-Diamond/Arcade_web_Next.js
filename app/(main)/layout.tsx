'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, redirect } from 'next/navigation'
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
import { MainNav } from '@/components/main-nav';
import { UserInfo } from '@/components/user-info';
import { Sidebar } from '@/components/sidebar';
import { VisitorUpgradePrompt } from '@/components/visitor-upgrade-prompt';

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

  const handleLogout = async () => {
    // Clear visitor-related localStorage items
    localStorage.removeItem('isVisitorAccount');
    localStorage.removeItem('visitorUsername');
    localStorage.removeItem('upgradingFromVisitor');
    
    await logout()
    router.push('/login')
  }

  const navItems = [
    { href: '/lobby', label: 'Lobby', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <Sidebar 
        navItems={navItems} 
        pathname={pathname} 
        user={user} 
        handleLogout={handleLogout} 
      />

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
            <UserInfo user={user} />
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
        <MainNav 
          setIsSidebarOpen={setIsSidebarOpen} 
          user={user} 
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4">
          <main className="flex-1">
            {children}
          </main>
          <VisitorUpgradePrompt />
        </div>
      </div>
    </div>
  )
}
