'use client'

import { useState, useCallback } from 'react'

interface CoinNotification {
  id: string
  change: number
}

export const useCoinNotifications = () => {
  const [notification, setNotification] = useState<CoinNotification | null>(null)

  const showCoinChange = useCallback((oldBalance: number, newBalance: number) => {
    const change = newBalance - oldBalance
    
    if (change !== 0) {
      const id = Date.now().toString()
      setNotification({ id, change })
    }
  }, [])

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showCoinChange,
    clearNotification
  }
}
