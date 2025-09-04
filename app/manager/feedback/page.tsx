'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, Calendar, User, Search, Filter, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Feedback {
  fileName: string
  userId: string
  userName: string
  title: string
  text: string
  timestamp: string
  date: Date
}

export default function ManagerFeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  // Check if user is authorized manager
  useEffect(() => {
    if (status === 'loading') return

    // Redirect to manager login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/manager-login')
      return
    }

    // Redirect to lobby if authenticated but not a manager
    if (session && !(session.user as any).isManager) {
      router.push('/lobby')
      return
    }
  }, [session, status, router])

  // Fetch all feedback files
  useEffect(() => {
    if (session && (session.user as any).isManager) {
      fetchFeedbacks()
    }
  }, [session])

  const fetchFeedbacks = async () => {
    try {
      // Use absolute URL to ensure we're calling the local API endpoint
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/app/api/feedback/list`)
      
      console.log('Fetching feedbacks from:', `${baseUrl}/app/api/feedback/list`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Feedback data:', data)
        setFeedbacks(data.feedbacks || [])
        setFilteredFeedbacks(data.feedbacks || [])
      } else {
        console.error('Failed to fetch feedbacks:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter feedbacks based on search term
  useEffect(() => {
    const filtered = feedbacks.filter(feedback => {
      const searchLower = searchTerm.toLowerCase()
      return (
        feedback.title.toLowerCase().includes(searchLower) ||
        feedback.userName.toLowerCase().includes(searchLower) ||
        feedback.text.toLowerCase().includes(searchLower) ||
        feedback.userId.toLowerCase().includes(searchLower)
      )
    })
    setFilteredFeedbacks(filtered)
  }, [searchTerm, feedbacks])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/app' })
  }

  // Show loading while checking authentication
  if (status === 'loading' || (session && !(session.user as any).isManager)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  // Only show content if user is a manager
  if (!session || !(session.user as any).isManager) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Feedback Manager
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                Logged in as: <span className="text-purple-400 font-medium">{session.user?.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search feedbacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <span className="text-purple-400 font-medium">
                  Total: {feedbacks.length} feedbacks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback list or loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm ? 'No feedbacks found matching your search' : 'No feedbacks available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.fileName}
                className="bg-black/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all cursor-pointer"
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feedback.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{feedback.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(feedback.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 line-clamp-3">
                  {feedback.text}
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  User ID: {feedback.userId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback detail modal */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="bg-black/90 border border-purple-500/30 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white mb-2">
                {selectedFeedback.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedFeedback.userName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedFeedback.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <p className="text-gray-300 whitespace-pre-wrap">
                {selectedFeedback.text}
              </p>
              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  User ID: {selectedFeedback.userId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  File: {selectedFeedback.fileName}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
