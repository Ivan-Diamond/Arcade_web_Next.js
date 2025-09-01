import { NextResponse } from 'next/server';

// Use server-side API URL if available, otherwise use public URL
const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://msaarcade.com/game/uaa';

export async function POST() {
  try {
    const apiUrl = `${API_BASE_URL}/v1/createNewVisitor`;
    console.log('Creating visitor account at:', apiUrl);
    
    // Call the backend API to create a new visitor account
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse response as JSON:', jsonError);
      const text = await response.text();
      console.error('Response text:', text);
      return NextResponse.json(
        { error: 'Backend service unavailable' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error('Failed to create visitor account:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create visitor account' },
        { status: response.status }
      );
    }

    // The backend returns visitor credentials in data object
    // Actual response format: { success: true, code: 20000, data: { username: string, password: string } }
    if (data.success && data.code === 20000 && data.data?.username && data.data?.password) {
      console.log('Successfully created visitor account:', data.data.username);
      return NextResponse.json({
        success: true,
        username: data.data.username,
        password: data.data.password,
        isVisitor: true,
      });
    } else {
      console.error('Invalid visitor creation response:', data);
      return NextResponse.json(
        { error: data.message || 'Invalid response from visitor creation API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating visitor account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
