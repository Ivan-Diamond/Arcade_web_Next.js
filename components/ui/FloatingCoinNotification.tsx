'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingCoinNotificationProps {
  change: number | null
  onComplete?: () => void
}

export default function FloatingCoinNotification({ change, onComplete }: FloatingCoinNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (change !== null && change !== 0) {
      setIsVisible(true)
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 1800) // Reduced from 3000ms to 1800ms

      return () => clearTimeout(timer)
    }
  }, [change, onComplete])

  if (!isVisible || change === null || change === 0) {
    return null
  }

  const isPositive = change > 0
  const displayChange = isPositive ? `+${change}` : `${change}`

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: 0,
            scale: 0.8
          }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -40, -80, -120],
            scale: [0.8, 1, 1, 0.9]
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.2, 0.8, 1],
            ease: "easeOut"
          }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className={`
            px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border
            ${isPositive 
              ? 'bg-green-500/20 border-green-400/50 text-green-400' 
              : 'bg-red-500/20 border-red-400/50 text-red-400'
            }
          `}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-bold">{displayChange}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
