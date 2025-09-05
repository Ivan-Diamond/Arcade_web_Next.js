'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { profileService } from '@/lib/api/services/profileService'
import { amplitudeService } from '@/lib/analytics/amplitude'
import Image from 'next/image'

// Available avatars - extracted from the files in public/images/avatars/
const AVAILABLE_AVATARS = [
  'Bianca',
  'axel', 
  'iris',
  'lucas',
  'olivia'
]

export default function AvatarsPage() {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const { user, updateUser } = useAuthStore()
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Track page view - TODO: Add avatar analytics events
  useEffect(() => {
    // amplitudeService.trackProfileEvent('AVATAR_PAGE_VIEWED', {
    //   current_avatar: user?.avatar || 'none'
    // })
  }, [user?.avatar])

  const handleAvatarSelect = (avatarName: string) => {
    setSelectedAvatar(avatarName)
    setErrorMessage('')
    setSuccessMessage('')
    
    // Track avatar selection - TODO: Add avatar analytics events
    // amplitudeService.trackProfileEvent('AVATAR_SELECTED', {
    //   selected_avatar: avatarName,
    //   previous_avatar: user?.avatar || 'none'
    // })
  }

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === user?.avatar) {
      return
    }

    setIsUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await profileService.updateAvatar(selectedAvatar)
      
      if (response.success) {
        // Update local user state
        updateUser({ avatar: selectedAvatar })
        
        // Update NextAuth session to persist avatar across page refreshes
        try {
          await updateSession({ avatar: selectedAvatar })
        } catch (sessionError) {
          console.warn('Failed to update session:', sessionError)
          // Continue anyway since the backend and store updates succeeded
        }
        
        // Track successful avatar update - TODO: Add avatar analytics events
        // amplitudeService.trackProfileEvent('AVATAR_UPDATED_SUCCESS', {
        //   new_avatar: selectedAvatar,
        //   previous_avatar: user?.avatar || 'none'
        // })
        
        setSuccessMessage('Avatar updated successfully!')
        
        // Auto-redirect after success
        setTimeout(() => {
          router.push('/profile')
        }, 1500)
      } else {
        throw new Error(response.error || 'Failed to update avatar')
      }
    } catch (error: any) {
      console.error('Error updating avatar:', error)
      setErrorMessage(error.message || 'Failed to update avatar')
      
      // Track failed avatar update - TODO: Add avatar analytics events
      // amplitudeService.trackProfileEvent('AVATAR_UPDATE_FAILED', {
      //   error: error.message,
      //   attempted_avatar: selectedAvatar
      // })
    } finally {
      setIsUpdating(false)
    }
  }

  const getAvatarImagePath = (avatarName: string) => {
    return `/app/images/avatars/${avatarName}_hello.webp`
  }

  const hasChanges = selectedAvatar && selectedAvatar !== user?.avatar

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Choose Avatar</h1>
            <p className="text-gray-400">Select your profile avatar</p>
          </div>
        </div>
      </motion.div>

      {/* Current Avatar Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-neon border-2 border-neon-cyan mb-8"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-1">
              <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center overflow-hidden">
                {selectedAvatar ? (
                  <Image
                    src={getAvatarImagePath(selectedAvatar)}
                    alt={selectedAvatar}
                    width={88}
                    height={88}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-neon-cyan" />
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">
              {selectedAvatar ? `${selectedAvatar} Avatar` : 'No Avatar Selected'}
            </h3>
            <p className="text-gray-400 text-sm">
              {selectedAvatar === user?.avatar ? 'Current avatar' : 'Preview'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-6"
        >
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-400">{successMessage}</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6"
        >
          <span className="text-red-400">{errorMessage}</span>
        </motion.div>
      )}

      {/* Avatar Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
      >
        {AVAILABLE_AVATARS.map((avatarName, index) => (
          <motion.button
            key={avatarName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => handleAvatarSelect(avatarName)}
            className={`relative p-4 rounded-xl transition-all duration-200 ${
              selectedAvatar === avatarName
                ? 'bg-neon-cyan/20 border-2 border-neon-cyan scale-105'
                : 'bg-dark-card border-2 border-transparent hover:border-gray-600 hover:scale-102'
            }`}
          >
            {/* Avatar Image */}
            <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
              <Image
                src={getAvatarImagePath(avatarName)}
                alt={avatarName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            </div>
            
            {/* Avatar Name */}
            <p className="text-sm font-semibold capitalize mb-2">
              {avatarName}
            </p>
            
            {/* Selection Indicator */}
            {selectedAvatar === avatarName && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 text-dark-bg" />
              </motion.div>
            )}
            
            {/* Current Avatar Indicator */}
            {user?.avatar === avatarName && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                Current
              </div>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4 justify-center"
      >
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-lg border-2 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
        >
          Cancel
        </button>
        
        <button
          onClick={handleSaveAvatar}
          disabled={!hasChanges || isUpdating}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            hasChanges && !isUpdating
              ? 'bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? 'Updating...' : 'Save Avatar'}
        </button>
      </motion.div>
    </div>
  )
}
