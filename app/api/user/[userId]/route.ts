import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = params.userId

    // Fetch user by ID using the same endpoint as leaderboard
    const userResponse = await fetch(`http://206.81.25.143:9991/uaa/v1/getUserById?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${session.jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user: ${userResponse.status}`)
    }

    const userData = await userResponse.json()
    
    if (userData.code === 20000 && userData.data?.user) {
      return NextResponse.json({
        code: 20000,
        data: {
          user: {
            id: userData.data.user.id || userId,
            username: userData.data.user.username || userData.data.user.nickname || userData.data.user.name,
            headimg: userData.data.user.headimg || userData.data.user.avatar || userData.data.user.headImg,
          }
        }
      })
    } else {
      return NextResponse.json({
        code: userData.code || -1,
        message: userData.message || 'User not found',
        data: null
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({
      code: -1,
      message: 'Failed to fetch user',
      data: null
    }, { status: 500 })
  }
}
