// Game notification types for extensible notification system
export enum NotificationType {
  WAWA_RESULT = 'WAWA_RESULT',
  GAME_RESULT = 'GAME_RESULT',
  BALL_COUNT = 'BALL_COUNT',
  SCORE = 'SCORE',
  // Add more notification types as needed
}

export interface WawaResultNotification {
  type: NotificationType.WAWA_RESULT
  isSuccess: boolean
  userId: string
  macNo: string
  ballColor?: {
    name: string
    color: string
  }
}

export interface GameResultNotification {
  type: NotificationType.GAME_RESULT
  isNormalEnd: boolean
  userId: string
  macNo: string
  totalGold?: number
  totalScore?: number
}

export interface BallCountNotification {
  type: NotificationType.BALL_COUNT
  ballCount: number
  userId: string
  macNo: string
}

export interface ScoreNotification {
  type: NotificationType.SCORE
  score: number
  income: number
  userId: string
  macNo: string
}

export type GameNotification = 
  | WawaResultNotification 
  | GameResultNotification 
  | BallCountNotification
  | ScoreNotification
