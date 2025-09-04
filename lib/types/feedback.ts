export interface FeedbackData {
  userId: string
  userName: string
  title: string
  text: string
  timestamp: string
}

export interface FeedbackSubmitRequest {
  title: string
  text: string
}

export interface FeedbackSubmitResponse {
  success: boolean
  error?: string
  filename?: string
}
