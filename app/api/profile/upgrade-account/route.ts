import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { newUsername, newPassword, newEmail } = await request.json()
    
    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Username is required' 
      }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Password is required' 
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

    // Validate email format if provided
    if (newEmail && newEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail.trim())) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid email format' 
        }, { status: 400 })
      }
    }

    console.log('Upgrading guest account for user:', session.user?.id, 'to username:', trimmedUsername)
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Build URL with query parameters as required by backend
    const url = new URL('http://206.81.25.143:9991/uaa/v1/upgradeCustomer')
    url.searchParams.append('newUsername', trimmedUsername)
    url.searchParams.append('newPassword', newPassword.trim())
    if (newEmail && newEmail.trim().length > 0) {
      url.searchParams.append('newEmail', newEmail.trim())
    }
    
    console.log('Upgrade request URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log('Upgrade account API response status:', response.status)
    console.log('Upgrade account API response headers:', Object.fromEntries(response.headers.entries()))

    let data
    try {
      data = await response.json()
      console.log('Upgrade account API response data:', JSON.stringify(data, null, 2))
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
      console.error('Upgrade account API error:', response.status, data)
      return NextResponse.json({ 
        success: false,
        error: data.message || data.error || 'Failed to upgrade account'
      }, { status: response.status })
    }

    // Check if the response indicates success
    if (data.code === 20000 && data.success !== false) {
      console.log('Account successfully upgraded to:', trimmedUsername)
      return NextResponse.json({
        success: true,
        data: {
          username: data.data?.username || trimmedUsername,
          jwt: data.data?.jwt || session.user?.jwt,
          message: 'Account upgraded successfully'
        }
      })
    } else {
      console.error('Account upgrade failed:', data)
      return NextResponse.json({
        success: false,
        error: data.message || data.error || 'Failed to upgrade account'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error upgrading account:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
