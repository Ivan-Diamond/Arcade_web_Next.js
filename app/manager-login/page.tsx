'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, AlertCircle } from 'lucide-react'

export default function ManagerLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        loginType: 'manager',
        redirect: false
      })

      if (result?.error) {
        setError('Invalid manager credentials')
      } else if (result?.ok) {
        // Redirect to feedback page on successful login
        router.push('/manager/feedback')
      }
    } catch (error) {
      console.error('Manager login error:', error)
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Login form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <Shield className="w-16 h-16 text-purple-400" />
              <div className="absolute inset-0 w-16 h-16 bg-purple-400/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Manager Access
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Authorized personnel only
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="Enter username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Info text */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-xs text-center">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Back to lobby link */}
        <div className="mt-6 text-center">
          <a
            href="/lobby"
            className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
          >
            ← Back to Lobby
          </a>
        </div>
      </div>
    </div>
  )
}
