'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  GameNotification, 
  NotificationType, 
  WawaResultNotification,
  GameResultNotification,
  BallCountNotification,
  ScoreNotification 
} from '@/lib/types/game-notifications'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { userService } from '@/lib/api/user-service'
import { getSession } from 'next-auth/react'
import { amplitudeService } from '@/lib/analytics/amplitude'

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

export function useGameNotifications(userId: string, onCoinChange?: (oldBalance: number, newBalance: number) => void) {
  const [currentNotification, setCurrentNotification] = useState<GameNotification | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<GameNotification[]>([])
  const previousCoinsRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  const { updateUser } = useAuthStore()
  
  // Initialize the previous coins ref on first load
  const initializeCoins = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        const session = await getSession()
        if (session?.user?.jwt) {
          const refreshResult = await userService.refreshUserData(session.user.jwt as string)
          if (refreshResult.success && refreshResult.data) {
            previousCoinsRef.current = refreshResult.data.coins
            isInitializedRef.current = true
            updateUser({ coins: refreshResult.data.coins })
          }
        }
      } catch (error) {
        console.error('Failed to initialize coins:', error)
      }
    }
  }, [updateUser])
  
  const handleWawaResult = useCallback(async (result: any) => {
    console.log('WawaResult received:', result)
    
    // Determine if the player won (data >= 1 means success)
    const isWin = result.data >= 1
    console.log('Win status:', isWin, 'Data value:', result.data)
    
    // Extract ball color if available and valid
    let ballColor = undefined
    if (isWin && result.data > 1) {
      const colorIndex = result.data - 1
      // Only set color if it's in the valid range (1-9, excluding 10 which is "Unknown")
      if (colorIndex >= 1 && colorIndex <= 9) {
        ballColor = BALL_COLORS[colorIndex]
      }
    }
    
    const notification: WawaResultNotification = {
      type: NotificationType.WAWA_RESULT,
      isSuccess: isWin,
      userId: result.userID || userId,
      macNo: result.macNo || '',
      ballColor: ballColor
    }
    
    // Track game result event
    amplitudeService.trackGameEvent('GAME_ENDED', {
      machine_id: result.macNo || '',
      result: isWin ? 'win' : 'loss',
      coins_won: isWin ? 10 : 0 // Adjust based on actual coins won
    })
    
    // Track prize won if applicable
    if (isWin) {
      amplitudeService.trackGameEvent('PRIZE_WON', {
        machine_id: result.macNo || '',
        coins_won: 10, // Adjust based on actual coins won
        prize_type: ballColor?.name
      })
    }
    
    console.log('Setting current notification:', notification)
    setCurrentNotification(notification)
    setNotificationHistory(prev => [...prev, notification])
    
    // Fetch updated user data including coins after game result
    try {
      const session = await getSession()
      if (session?.user?.jwt) {
        const refreshResult = await userService.refreshUserData(session.user.jwt as string)
        if (refreshResult.success && refreshResult.data) {
          console.log('Updated coins from server:', refreshResult.data.coins)
          const newCoins = refreshResult.data.coins
          const oldCoins = previousCoinsRef.current
          
          // Only show notification if:
          // 1. We have been initialized (not the first load)
          // 2. We have a previous value to compare
          // 3. The value actually changed
          if (isInitializedRef.current && oldCoins !== null && onCoinChange && oldCoins !== newCoins) {
            onCoinChange(oldCoins, newCoins)
          }
          
          // Mark as initialized and update reference
          isInitializedRef.current = true
          previousCoinsRef.current = newCoins
          updateUser({ coins: newCoins })
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }, [userId, updateUser, onCoinChange])

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

  const handleGameStart = useCallback(async (result: any) => {
    console.log('Game start received:', result)
    
    // Track game start is already handled in game-room page
    // This is just handling the coins update after game start
    
    // Refresh coin balance when game starts (deduct coins for playing)
    try {
      const session = await getSession()
      if (session?.user?.jwt) {
        const refreshResult = await userService.refreshUserData(session.user.jwt as string)
        if (refreshResult.success && refreshResult.data) {
          console.log('Updated coins after game start:', refreshResult.data.coins)
          const newCoins = refreshResult.data.coins
          const oldCoins = previousCoinsRef.current
          
          // Only show notification if:
          // 1. We have been initialized (not the first load)
          // 2. We have a previous value to compare
          // 3. The value actually changed
          if (isInitializedRef.current && oldCoins !== null && onCoinChange && oldCoins !== newCoins) {
            onCoinChange(oldCoins, newCoins)
          }
          
          // Mark as initialized and update reference
          isInitializedRef.current = true
          previousCoinsRef.current = newCoins
          updateUser({ coins: newCoins })
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data on game start:', error)
    }
  }, [updateUser, onCoinChange])

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
    handleGameStart,
    clearCurrentNotification,
    clearHistory,
    initializeCoins
  }
}
