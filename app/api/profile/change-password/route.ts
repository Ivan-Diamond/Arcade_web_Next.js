import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Current password is required' 
      }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'New password is required' 
      }, { status: 400 })
    }

    // Validate new password length
    if (newPassword.trim().length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Hash passwords with MD5 (consistent with existing auth system)
    const hashedCurrentPassword = crypto.createHash('md5').update(currentPassword.trim()).digest('hex')
    const hashedNewPassword = crypto.createHash('md5').update(newPassword.trim()).digest('hex')

    console.log('Changing password for user:', session.user?.username || session.user?.name)
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing')

    // Send request to backend with query parameters
    const url = new URL('http://206.81.25.143:9991/uaa/v1/changePassword')
    url.searchParams.append('username', session.user?.username || session.user?.name || '')
    url.searchParams.append('oldPassword', hashedCurrentPassword)
    url.searchParams.append('newPassword', hashedNewPassword)
    
    console.log('Request URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user?.jwt || ''}`,
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log('Change password API response status:', response.status)
    console.log('Change password API response headers:', Object.fromEntries(response.headers.entries()))

    let data
    try {
      data = await response.json()
      console.log('Change password API response data:', JSON.stringify(data, null, 2))
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
      console.error('Change password API error:', response.status, data)
      return NextResponse.json({ 
        success: false,
        error: data.message || data.error || 'Failed to change password'
      }, { status: response.status })
    }

    // Check if the response indicates success
    if (data.code === 20000 && data.success !== false) {
      console.log('Password successfully changed for user:', session.user?.username || session.user?.name)
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      })
    } else {
      console.error('Password change failed:', data)
      return NextResponse.json({
        success: false,
        error: data.message || data.error || 'Failed to change password'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
