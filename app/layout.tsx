import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MSA Arcade - Online Claw Machine Games',
  description: 'Play exciting claw machine games online and win virtual prizes!',
  keywords: 'arcade, claw machine, online games, virtual prizes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-dark-bg min-h-screen`}>
        <Providers>
          <div className="cyber-grid-bg min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
