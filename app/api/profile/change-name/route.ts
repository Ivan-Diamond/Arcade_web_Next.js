import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { newUsername } = await request.json()
    
    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Username is required' 
      }, { status: 400 })
    }

    // Validate username length and format
    const trimmedUsername = newUsername.trim()
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json({ 
        success: false,
        error: 'Username must be between 3 and 20 characters' 
      }, { status: 400 })
    }

    console.log('Changing username for user:', session.user?.id, 'to:', trimmedUsername)
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Try sending as query parameter since backend uses @RequestParam
    const url = new URL('http://206.81.25.143:9991/uaa/v1/changeUsername')
    url.searchParams.append('newUsername', trimmedUsername)
    
    console.log('Request URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log('Change username API response status:', response.status)
    console.log('Change username API response headers:', Object.fromEntries(response.headers.entries()))

    let data
    try {
      data = await response.json()
      console.log('Change username API response data:', JSON.stringify(data, null, 2))
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
      console.error('Change username API error:', response.status, data)
      return NextResponse.json({ 
        success: false,
        error: data.message || data.error || 'Failed to change username'
      }, { status: response.status })
    }

    // Check if the response indicates success
    if (data.code === 20000 && data.success !== false) {
      console.log('Username successfully changed to:', trimmedUsername)
      // Include the JWT token from the backend response
      return NextResponse.json({
        success: true,
        data: {
          username: data.data?.username || trimmedUsername,
          jwt: data.data?.jwt || session.user?.jwt,
          message: 'Username changed successfully'
        }
      })
    } else {
      console.error('Username change failed:', data)
      return NextResponse.json({
        success: false,
        error: data.message || data.error || 'Failed to change username'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error changing username:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
