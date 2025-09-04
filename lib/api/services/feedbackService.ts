import type { FeedbackSubmitRequest, FeedbackSubmitResponse } from '@/lib/types/feedback'

class FeedbackService {
  async submitFeedback(feedback: FeedbackSubmitRequest): Promise<FeedbackSubmitResponse> {
    try {
      const response = await fetch('/app/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to submit feedback'
        }
      }

      return data
    } catch (error) {
      console.error('Error submitting feedback:', error)
      return {
        success: false,
        error: 'Failed to submit feedback'
      }
    }
  }
}

export const feedbackService = new FeedbackService()
