'use client'

import { useState } from 'react'
import { MessageSquare, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { feedbackService } from '@/lib/api/services/feedbackService'
import type { FeedbackSubmitRequest } from '@/lib/types/feedback'

interface FeedbackFormProps {
  onClose?: () => void
}

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const titleLength = title.length
  const textLength = text.length
  const maxTitleLength = 100
  const maxTextLength = 1000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !text.trim()) {
      setError('Both title and feedback text are required')
      return
    }

    if (titleLength > maxTitleLength) {
      setError(`Title must be ${maxTitleLength} characters or less`)
      return
    }

    if (textLength > maxTextLength) {
      setError(`Feedback must be ${maxTextLength} characters or less`)
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const feedbackData: FeedbackSubmitRequest = {
        title: title.trim(),
        text: text.trim()
      }

      const result = await feedbackService.submitFeedback(feedbackData)

      if (result.success) {
        setIsSubmitted(true)
        setTitle('')
        setText('')
        
        // Close form after success delay
        setTimeout(() => {
          if (onClose) onClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to submit feedback')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="p-6 bg-gray-900/95 backdrop-blur-sm border border-green-500/30 rounded-xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-green-400">
            Thank You!
          </h3>
          <p className="text-gray-300">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your feedback..."
            className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg 
                     text-white placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                     transition-all duration-200"
            disabled={isSubmitting}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {titleLength > maxTitleLength ? 'Title too long' : ''}
            </span>
            <span className={`text-xs ${titleLength > maxTitleLength ? 'text-red-400' : 'text-gray-500'}`}>
              {titleLength}/{maxTitleLength}
            </span>
          </div>
        </div>

        {/* Text Field */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-2">
            Feedback
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts, suggestions, or report any issues..."
            rows={6}
            className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg 
                     text-white placeholder-gray-400 resize-none
                     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                     transition-all duration-200"
            disabled={isSubmitting}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {textLength > maxTextLength ? 'Feedback too long' : ''}
            </span>
            <span className={`text-xs ${textLength > maxTextLength ? 'text-red-400' : 'text-gray-500'}`}>
              {textLength}/{maxTextLength}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !text.trim() || titleLength > maxTitleLength || textLength > maxTextLength}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 
                   hover:from-cyan-400 hover:to-blue-400
                   disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                   text-white font-medium rounded-lg transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900
                   flex items-center justify-center gap-2
                   shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  )
}
