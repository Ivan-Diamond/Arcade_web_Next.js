import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatMachineName } from '@/lib/utils/formatMachineName'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0') // Backend expects 0-based
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    console.log('Fetching game history with params:', { page, pageSize })
    console.log('Session data:', JSON.stringify(session, null, 2))
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Use URLSearchParams like rankings API (backend expects 'size' not 'pageSize')
    const params = new URLSearchParams({
      page: page.toString(),
      size: pageSize.toString()
    })
    
    const response = await fetch(`http://206.81.25.143:9991/uaa/v1/getAllGameRecordListByManager?${params}&UserID=${session.user?.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('History API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('History API error:', response.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch game history', 
        status: response.status,
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('History API response data:', JSON.stringify(data, null, 2))
    
    // Transform the response to match the expected format
    if (data.code === 20000 && data.data?.data) {
      // Data is nested under data.data for this endpoint
      const gameData = data.data.data
      const allRecords = gameData.content || []
      
      // FILTER records by current user ID since backend doesn't filter properly
      const userIdNumber = parseInt(session.user?.id || '0')
      const userRecords = allRecords.filter((record: any) => record.userID === userIdNumber)
      
      console.log('History API - Filtered records for user', userIdNumber, ':', userRecords.length, 'out of', allRecords.length, 'total')
      
      // Transform each record to match expected frontend format
      const records = userRecords.map((record: any) => {
        const rawGameName = record.gameName || record.machineName || record.machine?.machineName || 'Unknown Game'
        return {
          id: record.id,
          machineName: formatMachineName(rawGameName),
          startTime: new Date(record.createTime || 0).toISOString(),
          duration: Math.floor(((record.stopTime || record.createTime) - (record.createTime || 0)) / 1000), // in seconds
          result: record.finishStatus === 1 ? (record.isWinOnWawaMac ? 'win' : 'lose') : 'timeout',
          coinsSpent: record.cost || record.price || 0,
          coinsEarned: record.winAmount || 0,
          userID: record.userID
        }
      })

      const transformedData = {
        records,
        pagination: {
          total: gameData.totalElements || 0,
          page: (gameData.number || 0) + 1, // Convert from 0-based to 1-based for UI
          pageSize: gameData.size || 20,
          totalPages: gameData.totalPages || 0,
          hasMore: !gameData.last || false
        }
      }
      
      return NextResponse.json({
        success: true,
        data: transformedData
      })
    } else {
      // Return raw data if structure is unexpected
      return NextResponse.json({
        success: true,
        data: {
          records: [],
          pagination: {
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            hasMore: false
          }
        }
      })
    }
  } catch (error) {
    console.error('Error fetching game history:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch game history' 
    }, { status: 500 })
  }
}
