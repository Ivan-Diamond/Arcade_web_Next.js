import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.jwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching lobby data from:', `http://206.81.25.143:9991/app/lobby`);
    console.log('Using JWT:', session.user?.jwt ? 'Present' : 'Missing');

    // Try different lobby endpoints that might exist
    const endpoints = [
      'http://206.81.25.143:9991/uaa/app/lobby',
      'http://206.81.25.143:9991/app/lobby',
      'http://206.81.25.143:9991/v1/lobby', 
      'http://206.81.25.143:9991/lobby',
      'http://206.81.25.143:9991/getAllMacListByType'
    ];

    let response: Response | undefined;
    let lastError = '';
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${session.user?.jwt || ''}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned ${response.status}`);
          lastError = `${endpoint}: ${response.status}`;
        }
      } catch (err) {
        console.log(`Endpoint ${endpoint} failed:`, err);
        lastError = `${endpoint}: ${err}`;
      }
    }

    if (!response) {
      console.error('All lobby endpoints failed:', lastError);
      return NextResponse.json({ error: 'All lobby endpoints failed', details: lastError }, { status: 404 });
    }

    console.log('Lobby API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lobby API error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch from backend', status: response.status }, { status: response.status });
    }

    const data = await response.json();
    console.log('Lobby API response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch lobby data:', error);
    return NextResponse.json({ error: 'Failed to fetch lobby data' }, { status: 500 });
  }
}
