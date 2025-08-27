import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cameraServerIP, api, streamurl, sdp } = body
    
    console.log('Proxying WebRTC signaling request:')
    console.log('Camera Server:', cameraServerIP)
    console.log('API:', api)
    console.log('Stream URL:', streamurl)
    
    // Forward the request to the actual camera server
    const response = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api,
        streamurl,
        sdp
      })
    })
    
    const result = await response.text()
    console.log('Signaling response status:', response.status)
    console.log('Signaling response:', result.substring(0, 200))
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera server error: ${response.status}`, details: result },
        { status: response.status }
      )
    }
    
    try {
      const jsonResult = JSON.parse(result)
      return NextResponse.json(jsonResult)
    } catch {
      // Return raw text if not JSON
      return new NextResponse(result, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
  } catch (error: any) {
    console.error('WebRTC signaling proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy signaling request', details: error.message },
      { status: 500 }
    )
  }
}
