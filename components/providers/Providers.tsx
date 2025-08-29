'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider basePath="/app/api/auth">
      {children}
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
