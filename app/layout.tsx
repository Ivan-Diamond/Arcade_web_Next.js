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
      <head>
        <script src="https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz"></script>
        <script src="https://cdn.amplitude.com/libs/plugin-session-replay-browser-1.19.3-min.js.gz"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.amplitudeReady = false;
            
            // Initialize Amplitude only after both scripts are fully loaded
            window.addEventListener('load', function() {
              setTimeout(function() {
                if (window.amplitude && window.sessionReplay && window.sessionReplay.plugin) {
                  try {
                    // Create session replay plugin with proper config
                    const sessionReplayPlugin = window.sessionReplay.plugin({
                      sampleRate: 1,
                      privacyConfig: {
                        maskAllInputs: true,
                        maskAllText: false
                      }
                    });
                    
                    // Add plugin before initialization
                    window.amplitude.add(sessionReplayPlugin);
                    
                    // Initialize with minimal config and proper device ID handling
                    window.amplitude.init('929ddfcf255f17a5ade4094d9fd287c1', {
                      defaultTracking: false, // Disable default tracking to avoid conflicts
                      flushIntervalMillis: 1000,
                      flushQueueSize: 10,
                      flushMaxRetries: 2
                    });
                    
                    window.amplitudeReady = true;
                    console.log('Amplitude initialized successfully');
                  } catch (error) {
                    console.error('Failed to initialize Amplitude:', error);
                  }
                } else {
                  console.error('Amplitude libraries not loaded');
                }
              }, 500); // Wait a bit after page load
            });
          `
        }} />
      </head>
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
