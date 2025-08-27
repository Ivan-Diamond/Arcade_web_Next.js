import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.jwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/app/lobby`, {
      headers: {
        'Authorization': `Bearer ${session.jwt}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch lobby data:', error);
    return NextResponse.json({ error: 'Failed to fetch lobby data' }, { status: 500 });
  }
}
