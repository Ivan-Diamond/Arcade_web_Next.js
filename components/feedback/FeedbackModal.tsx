'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { FeedbackForm } from './FeedbackForm'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-gray-800 hover:bg-gray-700 
                   border border-gray-600 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
        
        {/* Form */}
        <FeedbackForm onClose={onClose} />
      </div>
    </div>
  )
}
