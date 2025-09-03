'use client'

import { ReactNode, useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { amplitudeService } from '@/lib/analytics/amplitude'

interface ProvidersProps {
  children: ReactNode
}

function AmplitudeProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Initialize Amplitude on mount
    amplitudeService.init()
  }, [])

  useEffect(() => {
    // Identify user when session changes
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any
      amplitudeService.identify({
        id: user.id || user.email || 'unknown',
        username: user.username || user.name,
        email: user.email,
        userType: user.isVisitor ? 'visitor' : 'registered',
        coins: user.coins || 0
      })
    } else if (status === 'unauthenticated') {
      // Track anonymous users
      amplitudeService.track('Anonymous Session Started')
    }
  }, [session, status])

  return <>{children}</>
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider basePath="/app/api/auth">
      <AmplitudeProvider>
        {children}
      </AmplitudeProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E2344',
            color: '#fff',
            border: '1px solid #2A3155',
          },
          error: {
            iconTheme: {
              primary: '#FF10F0',
              secondary: '#1E2344',
            },
          },
        }}
      />
    </SessionProvider>
  )
}
