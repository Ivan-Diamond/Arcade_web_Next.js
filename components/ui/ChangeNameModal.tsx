'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, AlertCircle } from 'lucide-react'

interface ChangeNameModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newUsername: string) => Promise<void>
  currentUsername: string
  isLoading?: boolean
}

export default function ChangeNameModal({
  isOpen,
  onClose,
  onSubmit,
  currentUsername,
  isLoading = false
}: ChangeNameModalProps) {
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend validation
    const trimmedUsername = newUsername.trim()
    if (!trimmedUsername) {
      setError('Username is required')
      return
    }
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError('Username must be between 3 and 20 characters')
      return
    }
    if (trimmedUsername === currentUsername) {
      setError('New username must be different from current username')
      return
    }

    try {
      await onSubmit(trimmedUsername)
      setNewUsername('')
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to change username')
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNewUsername('')
      setError('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="card-neon border-2 border-neon-cyan w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-neon-cyan" />
                  <h2 className="text-xl font-semibold">Change Username</h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Username */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Current Username</label>
                <div className="bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-gray-300">
                  {currentUsername}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="newUsername" className="block text-sm text-gray-400 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-neon-cyan focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Enter new username"
                    maxLength={20}
                    autoComplete="off"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">3-20 characters</span>
                    <span className="text-xs text-gray-500">{newUsername.length}/20</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-400">{error}</span>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !newUsername.trim()}
                    className="flex-1 bg-neon-cyan hover:bg-neon-cyan/80 text-dark-card font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-dark-card/30 border-t-dark-card rounded-full animate-spin"></div>
                        Changing...
                      </div>
                    ) : (
                      'Change Username'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
