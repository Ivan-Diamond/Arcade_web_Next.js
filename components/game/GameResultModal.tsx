'use client'

import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { WawaResultNotification } from '@/lib/types/game-notifications'

interface GameResultModalProps {
  notification: WawaResultNotification | null
  onClose: () => void
  onPlayAgain?: () => void
}

// Function to randomly select a reaction face
const getRandomReactionFace = (isSuccess: boolean): string => {
  const victoryFaces = ['axel_smiling', 'bianca_smiling', 'iris_smiling', 'lucas_smiling', 'olivia_smiling']
  const defeatFaces = ['axel_cry', 'bianca_cry', 'iris_cry', 'lucas_cry', 'olivia_cry']
  
  const faces = isSuccess ? victoryFaces : defeatFaces
  const randomIndex = Math.floor(Math.random() * faces.length)
  return `/app/images/reaction_faces/${faces[randomIndex]}.webp`
}

export default function GameResultModal({ notification, onClose, onPlayAgain }: GameResultModalProps) {
  console.log('GameResultModal received notification:', notification)
  
  // Memoize the reaction face to prevent re-rendering changes
  const reactionFace = useMemo(() => {
    return notification ? getRandomReactionFace(notification.isSuccess) : null
  }, [notification])
  
  useEffect(() => {
    if (notification?.isSuccess) {
      // Play win sound
      const audio = new Audio('/sounds/win.mp3')
      audio.play().catch(e => console.log('Audio play failed:', e))
    } else if (notification && !notification.isSuccess) {
      // Play lose sound
      const audio = new Audio('/sounds/lose.mp3')
      audio.play().catch(e => console.log('Audio play failed:', e))
    }

    // Auto-close after 4 seconds
    if (notification) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  if (!notification) return null

  const isSuccess = notification.isSuccess

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: isSuccess ? 360 : 0,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.8
              }
            }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative max-w-md w-full"
          >
            <div className={`
              bg-dark-bg border-2 rounded-2xl p-8
              ${isSuccess ? 'border-neon-green shadow-neon-green' : 'border-neon-pink shadow-neon-pink'}
              shadow-lg
            `}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Reaction Face Animation */}
              <motion.div
                initial={{ y: -20, scale: 0 }}
                animate={{ 
                  y: [0, -10, 0],
                  scale: 1,
                  transition: {
                    y: {
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    },
                    scale: {
                      delay: 0.2,
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }
                  }
                }}
                className="flex justify-center mb-6"
              >
                <div className={`
                  w-32 h-32 rounded-full flex items-center justify-center p-2
                  ${isSuccess 
                    ? 'bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 border-2 border-neon-green' 
                    : 'bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border-2 border-neon-pink'}
                  shadow-lg overflow-hidden
                `}>
                  {reactionFace && (
                    <img 
                      src={reactionFace}
                      alt={isSuccess ? 'Victory reaction' : 'Defeat reaction'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
              </motion.div>

              {/* Result Text */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-3xl font-bold text-center mb-4 ${
                  isSuccess ? 'text-neon-green' : 'text-neon-pink'
                }`}
              >
                {isSuccess ? 'You Got It!' : 'Better Luck Next Time!'}
              </motion.h2>

              {/* Ball Color Display (if success and has color) */}
              {isSuccess && notification.ballColor && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-dark-purple/50 rounded-lg border border-neon-purple"
                >
                  <p className="text-center text-gray-300 mb-3">
                    You caught a special ball!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-white font-medium">Color:</span>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: notification.ballColor.color }}
                    />
                    <span className="text-neon-cyan font-bold">
                      {notification.ballColor.name}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Additional Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-gray-400 mt-4"
              >
                {isSuccess 
                  ? 'Great job! Your prize has been added to your collection.'
                  : 'Don\'t give up! Try again for another chance.'}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-4 mt-6"
              >
                {onPlayAgain && (
                  <button
                    onClick={() => {
                      onClose()
                      onPlayAgain()
                    }}
                    className={`
                      flex-1 py-3 px-6 rounded-lg font-semibold text-black
                      transition-all duration-200
                      ${isSuccess 
                        ? 'bg-neon-green hover:bg-neon-green/80 shadow-neon-green/50' 
                        : 'bg-neon-pink hover:bg-neon-pink/80 shadow-neon-pink/50'}
                      shadow-lg hover:shadow-xl
                    `}
                  >
                    Play Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`
                    ${onPlayAgain ? 'flex-1' : 'w-full'} py-3 px-6 rounded-lg font-semibold
                    transition-all duration-200
                    bg-gray-700 hover:bg-gray-600 text-white
                    shadow-lg hover:shadow-xl
                  `}
                >
                  Continue
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
