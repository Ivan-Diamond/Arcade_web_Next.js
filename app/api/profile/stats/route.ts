import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ProfileStats } from '@/lib/types/profile'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Fetching profile stats for user:', session.user?.id)
    console.log('Session user data:', {
      id: session.user?.id,
      username: session.user?.username || session.user?.name,
      email: session.user?.email
    })
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Fetch all history data with large page size to get complete statistics
    const params = new URLSearchParams({
      page: '0',
      size: '100000' // Large size to get most/all records
    })
    
    const backendUrl = `http://206.81.25.143:9991/uaa/v1/getAllGameRecordListByManager?${params}&UserID=${session.user?.id}`
    console.log('Backend URL being called:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Profile stats API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Profile stats API error:', response.status, errorText)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch game history for stats', 
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('Profile stats - total records found:', data.data?.data?.totalElements || 0)
    console.log('Profile stats - first few records userIDs:', data.data?.data?.content?.slice(0, 3).map((r: any) => r.userID))
    
    // Calculate statistics from history data
    if (data.code === 20000 && data.data?.data) {
      const gameData = data.data.data
      const allRecords = gameData.content || []
      
      // FILTER records by current user ID since backend doesn't filter properly
      const userIdNumber = parseInt(session.user?.id || '0')
      const records = allRecords.filter((record: any) => record.userID === userIdNumber)
      
      console.log('Filtered records for user', userIdNumber, ':', records.length, 'out of', allRecords.length, 'total')
      
      // Calculate statistics
      const totalGames = records.length
      const totalWins = records.filter((record: any) => record.isWinOnWawaMac === true).length
      const totalLosses = totalGames - totalWins
      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100 * 100) / 100 : 0 // Round to 2 decimal places
      
      const totalCoinsSpent = records.reduce((sum: number, record: any) => 
        sum + (record.cost || record.price || 0), 0)
      const totalCoinsEarned = records.reduce((sum: number, record: any) => 
        sum + (record.winAmount || 0), 0)
      const netCoins = totalCoinsEarned - totalCoinsSpent

      const stats: ProfileStats = {
        totalGames,
        totalWins,
        totalLosses,
        winRate,
        totalCoinsSpent,
        totalCoinsEarned,
        netCoins
      }

      console.log('Calculated profile stats:', stats)

      return NextResponse.json({
        success: true,
        data: stats
      })
    } else {
      // Return empty stats if no data
      const emptyStats: ProfileStats = {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalCoinsSpent: 0,
        totalCoinsEarned: 0,
        netCoins: 0
      }

      return NextResponse.json({
        success: true,
        data: emptyStats
      })
    }
  } catch (error) {
    console.error('Error calculating profile stats:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to calculate profile statistics' 
    }, { status: 500 })
  }
}
