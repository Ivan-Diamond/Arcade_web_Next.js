'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Lock, Mail, ArrowRight, Zap, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import crypto from 'crypto-js'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      // Hash the password with MD5
      const passwordHash = crypto.MD5(formData.password).toString()
      
      // Call the registration API using the same base URL as login
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://msaarcade.com/game/uaa'
      const response = await fetch(
        `${API_BASE_URL}/v1/customer_register?username=${formData.username}&password=${passwordHash}&email=${formData.email}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      
      if (data.code === 20000) {
        toast.success('Account created successfully!')
        // Auto-login after successful registration
        await autoLogin(formData.username, passwordHash)
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const autoLogin = async (username: string, passwordHash: string) => {
    try {
      // Use NextAuth signIn for consistency with login page
      const { signIn } = await import('next-auth/react')
      const result = await signIn('credentials', {
        username: username,
        password: formData.password, // Use original password, not hash
        redirect: false,
      })

      if (result?.error) {
        console.error('Auto-login failed:', result.error)
        router.push('/login')
      } else {
        toast.success('Logged in successfully!')
        router.push('/lobby')
      }
    } catch (error) {
      console.error('Auto-login failed:', error)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-neon-pink rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-neon-green rounded-full opacity-20 blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card-neon backdrop-blur-neon">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-4"
            >
              <Zap className="w-16 h-16 text-neon-pink mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Join the Arcade</h1>
            <p className="text-gray-400">Create your account to start playing</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-pink" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-pink" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-pink" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-pink" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-neon btn-neon-pink flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-neon-cyan hover:text-neon-green transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
