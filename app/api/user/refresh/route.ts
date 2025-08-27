import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { jwt } = await request.json()
    
    if (!jwt) {
      return NextResponse.json({ error: 'JWT token required' }, { status: 401 })
    }

    // Use HTTP instead of HTTPS to bypass SSL certificate issues
    const response = await fetch('http://206.81.25.143:9991/uaa/v1/getCustomerInfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      throw new Error('Failed to fetch user info')
    }

    const result = await response.json()
    
    if (result.code === 20000 && result.data?.data) {
      return NextResponse.json({
        success: true,
        data: {
          coins: result.data.data.gold || 0,
          score: result.data.data.stamp || 0,
        }
      })
    }
    
    return NextResponse.json({ success: false })
  } catch (error) {
    console.error('Error refreshing user data:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
