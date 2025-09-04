'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackButtonProps {
  variant?: 'icon' | 'full' | 'profile'
  className?: string
  onClick?: () => void
}

export function FeedbackButton({ variant = 'full', className = '', onClick }: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
    if (onClick) onClick()
  }

  if (variant === 'profile') {
    return (
      <>
        <button
          onClick={handleClick}
          className={className}
        >
          <MessageSquare className="w-6 h-6 text-neon-purple mb-2" />
          <span className="text-sm font-semibold">Feedback</span>
        </button>
        <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`p-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 
                     hover:border-cyan-500 text-cyan-400 hover:text-cyan-300
                     rounded-lg transition-all duration-200
                     flex items-center justify-center
                     shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 ${className}`}
          title="Send Feedback"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
                   hover:from-cyan-500/30 hover:to-blue-500/30
                   border border-cyan-500/50 hover:border-cyan-500
                   text-cyan-400 hover:text-cyan-300 font-medium rounded-lg 
                   transition-all duration-200 flex items-center gap-2
                   shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Feedback
      </button>
      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
