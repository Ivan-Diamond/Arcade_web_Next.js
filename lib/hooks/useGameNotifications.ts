'use client'

import { useState, useCallback } from 'react'
import { 
  GameNotification, 
  NotificationType, 
  WawaResultNotification,
  GameResultNotification,
  BallCountNotification,
  ScoreNotification 
} from '@/lib/types/game-notifications'

// Ball color mapping based on result data - 1
const BALL_COLORS: Record<number, { name: string; color: string }> = {
  1: { name: 'Yellow', color: '#FFFF00' },
  2: { name: 'Red', color: '#FF0000' },
  3: { name: 'Green', color: '#00FF00' },
  4: { name: 'Blue', color: '#0000FF' },
  5: { name: 'Purple', color: '#800080' },
  6: { name: 'Orange', color: '#FFA500' },
  7: { name: 'Pink', color: '#FFC0CB' },
  8: { name: 'Black', color: '#000000' },
  9: { name: 'White', color: '#FFFFFF' },
  10: { name: 'Unknown', color: '#808080' },
}

export function useGameNotifications(userId: string) {
  const [currentNotification, setCurrentNotification] = useState<GameNotification | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<GameNotification[]>([])

  const handleWawaResult = useCallback((result: any) => {
    console.log('WawaResult received:', result)
    
    // result.data: 0 = failure, 1+ = success with ball color
    // Ball color = data - 1 (when data > 1)
    const isWin = result.data >= 1
    let ballColor = undefined
    
    if (isWin && result.data > 1) {
      const colorIndex = result.data - 1
      ballColor = BALL_COLORS[colorIndex] || BALL_COLORS[10] // Default to Unknown
    } else if (isWin && result.data === 1) {
      // Win but no color info, default to Unknown
      ballColor = BALL_COLORS[10]
    }
    
    const notification: WawaResultNotification = {
      type: NotificationType.WAWA_RESULT,
      isSuccess: isWin,
      userId: result.userID || userId,
      macNo: result.macNo || '',
      ballColor: ballColor
    }
    
    setCurrentNotification(notification)
    setNotificationHistory(prev => [...prev, notification])
  }, [userId])

  const handleGameResult = useCallback((result: any) => {
    console.log('GameResult received:', result)
    
    const notification: GameResultNotification = {
      type: NotificationType.GAME_RESULT,
      isNormalEnd: result.gameFinishFlag === 1,
      userId: result.userID || userId,
      macNo: result.macNo || '',
      totalGold: result.totalGold,
      totalScore: result.totalScore
    }
    
    setCurrentNotification(notification)
    setNotificationHistory(prev => [...prev, notification])
  }, [userId])

  const handleBallCount = useCallback((result: any) => {
    console.log('BallCount received:', result)
    
    const notification: BallCountNotification = {
      type: NotificationType.BALL_COUNT,
      ballCount: result.ballCount || 0,
      userId: result.userID || userId,
      macNo: result.macNo || ''
    }
    
    // For ball count, we might not want to show a modal
    // Just update state or show a toast
    setNotificationHistory(prev => [...prev, notification])
  }, [userId])

  const handleScore = useCallback((result: any) => {
    console.log('Score received:', result)
    
    const notification: ScoreNotification = {
      type: NotificationType.SCORE,
      score: result.score || 0,
      income: result.inCome || 0,
      userId: result.userID || userId,
      macNo: result.macNo || ''
    }
    
    // For score updates, we might not want to show a modal
    // Just update state or show a toast
    setNotificationHistory(prev => [...prev, notification])
  }, [userId])

  const clearCurrentNotification = useCallback(() => {
    setCurrentNotification(null)
  }, [])

  const clearHistory = useCallback(() => {
    setNotificationHistory([])
  }, [])

  return {
    currentNotification,
    notificationHistory,
    handleWawaResult,
    handleGameResult,
    handleBallCount,
    handleScore,
    clearCurrentNotification,
    clearHistory
  }
}
