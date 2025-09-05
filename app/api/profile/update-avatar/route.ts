import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { avatar } = await request.json()
    
    if (!avatar || typeof avatar !== 'string' || avatar.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Avatar is required' 
      }, { status: 400 })
    }

    const trimmedAvatar = avatar.trim()

    console.log('Updating avatar for user:', session.user?.username || session.user?.name, 'to:', trimmedAvatar)
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Send request to backend with query parameter
    const url = new URL('http://206.81.25.143:9991/uaa/v1/updateAvatar')
    url.searchParams.append('avatar', trimmedAvatar)
    
    console.log('Request URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log('Update avatar API response status:', response.status)
    console.log('Update avatar API response headers:', Object.fromEntries(response.headers.entries()))

    let data
    try {
      data = await response.json()
      console.log('Update avatar API response data:', JSON.stringify(data, null, 2))
    } catch (jsonError) {
      console.error('Failed to parse response as JSON:', jsonError)
      const text = await response.text()
      console.error('Response text:', text)
      return NextResponse.json({
        success: false,
        error: 'Backend service unavailable'
      }, { status: 502 })
    }

    if (!response.ok) {
      console.error('Update avatar API error:', response.status, data)
      return NextResponse.json({ 
        success: false,
        error: data.message || data.error || 'Failed to update avatar'
      }, { status: response.status })
    }

    // Check if the response indicates success
    if (data.code === 20000 && data.success !== false) {
      console.log('Avatar successfully updated to:', trimmedAvatar)
      return NextResponse.json({
        success: true,
        data: {
          avatar: data.data?.avatar || trimmedAvatar,
          message: 'Avatar updated successfully'
        }
      })
    } else {
      console.error('Avatar update failed:', data)
      return NextResponse.json({
        success: false,
        error: data.message || data.error || 'Failed to update avatar'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
