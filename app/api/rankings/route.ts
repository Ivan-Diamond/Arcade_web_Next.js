import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch win games from backend with pagination parameters
    const params = new URLSearchParams({
      page: '0',
      size: '1000000'
    })
    
    const response = await fetch(`http://206.81.25.143:9991/uaa/v1/getWawaWinGames?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch rankings: ${response.status}`)
    }

    const data = await response.json()
    console.log('Full Rankings API response:', JSON.stringify(data, null, 2))
    
    // Handle both success (20000) and potential error codes
    if ((data.code === 20000 || data.code === 20001) && data.data) {
      // Handle different possible data structures
      let winGames: any[] = []
      
      if (data.data?.data?.content) {
        // Nested paginated structure
        winGames = data.data.data.content
      } else if (data.data?.content) {
        // Direct paginated structure
        winGames = data.data.content
      } else if (Array.isArray(data.data)) {
        // Direct array
        winGames = data.data
      }
      
      console.log(`Found ${winGames.length} win games to process`)
      
      if (winGames.length === 0) {
        // No games found, return empty rankings
        return NextResponse.json({
          code: 20000,
          data: []
        })
      }
      
      // Aggregate win amounts by user ID
      const userTotals = new Map<number, { userId: number, totalWins: number, winAmount: number }>()
      
      winGames.forEach((game: any) => {
        if (game.userID) {
          const userId = game.userID
          const winAmount = game.winAmount || 0
          
          if (userTotals.has(userId)) {
            const current = userTotals.get(userId)!
            current.totalWins++
            current.winAmount += winAmount
          } else {
            userTotals.set(userId, {
              userId,
              totalWins: 1,
              winAmount
            })
          }
        }
      })
      
      // Convert to array for both sorting methods
      const allUsers = Array.from(userTotals.values())
      
      // Sort by total wins
      const topUsersByWins = [...allUsers]
        .sort((a, b) => b.totalWins - a.totalWins)
        .slice(0, 10)
      
      // Sort by win amount (coins)
      const topUsersByCoins = [...allUsers]
        .sort((a, b) => b.winAmount - a.winAmount)
        .slice(0, 10)
      
      console.log('Top users by wins:', topUsersByWins)
      console.log('Top users by coins:', topUsersByCoins)
      
      // Helper function to create rankings
      const createRankings = async (topUsers: any[]): Promise<any[]> => {
        return await Promise.all(
          topUsers.map(async (user) => {
            let username = `Player #${user.userId}`
            let headimg = ''
            
            
            try {
              console.log(`Starting fetch for userId: ${user.userId}`)
              const userResponse = await fetch(`http://206.81.25.143:9991/uaa/v1/getUserById?userId=${user.userId}`, {
                headers: {
                  'Authorization': `Bearer ${session.jwt}`,
                  'Content-Type': 'application/json',
                },
              })
            
            console.log(`User response status for ${user.userId}: ${userResponse.status}`)
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              console.log(`User data for ${user.userId}:`, JSON.stringify(userData, null, 2))
              
              if (userData.code === 20000 && userData.data?.user) {
                // Extract username from nested user object
                username = userData.data.user.username || userData.data.user.nickname || userData.data.user.name || username
                headimg = userData.data.user.headimg || userData.data.user.avatar || userData.data.user.headImg || ''
                console.log(`Found username: ${username} for userId: ${user.userId}`)
              } else {
                console.log(`No valid user data found for ${user.userId}, code: ${userData.code}`)
              }
            } else {
              const errorText = await userResponse.text()
              console.log(`Failed to fetch user ${user.userId}, status: ${userResponse.status}, error: ${errorText}`)
            }
          } catch (error) {
            console.error(`Failed to fetch username for user ${user.userId}:`, error)
          }
          
          
          return {
            user_id: user.userId,
            name: username,
            headimg: headimg,
            title: user.totalWins >= 100 ? 'Master' : user.totalWins >= 50 ? 'Expert' : user.totalWins >= 20 ? 'Pro' : 'Player',
            cnt: user.totalWins,
            winAmount: user.winAmount
          }
        })
      )
    }
      
      console.log(`Aggregated ${winGames.length} games into rankings`)
      
      // Create both rankings
      const rankingsByWins = await createRankings(topUsersByWins)
      const rankingsByCoins = await createRankings(topUsersByCoins)
      
      return NextResponse.json({ 
        data: {
          byWins: rankingsByWins,
          byCoins: rankingsByCoins
        }
      })
    } else {
      console.log('Unexpected data structure, returning as-is')
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error fetching rankings:', error)
    
    // Return mock data if API fails
    return NextResponse.json({
      code: 20000,
      data: [
        { user_id: 1, name: 'ProGamer123', headimg: '', title: 'Master', cnt: 342 },
        { user_id: 2, name: 'ArcadeMaster', headimg: '', title: 'Expert', cnt: 298 },
        { user_id: 3, name: 'NeonKing', headimg: '', title: 'Expert', cnt: 256 },
        { user_id: 4, name: 'CyberPunk', headimg: '', title: 'Pro', cnt: 212 },
        { user_id: 5, name: 'PixelWarrior', headimg: '', title: 'Pro', cnt: 198 },
      ]
    })
  }
}
