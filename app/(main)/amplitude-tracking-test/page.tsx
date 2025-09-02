'use client'

import { useState, useEffect } from 'react'
import { amplitudeService } from '@/lib/analytics/amplitude'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'failed'
  error?: string
}

export default function AmplitudeTrackingTestPage() {
  const { user } = useAuthStore()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const testEvents = [
    {
      name: 'Navigation - Page Viewed',
      run: () => {
        amplitudeService.trackNavigationEvent('PAGE_VIEWED', {
          page_path: '/test',
          page_name: 'test',
          user_id: user?.id
        })
      }
    },
    {
      name: 'Navigation - Nav Item Clicked',
      run: () => {
        amplitudeService.trackNavigationEvent('NAV_ITEM_CLICKED', {
          from_page: '/test',
          to_page: '/lobby',
          nav_item: 'Lobby',
          source: 'test'
        })
      }
    },
    {
      name: 'Home - Landing Page Viewed',
      run: () => {
        amplitudeService.trackHomeEvent('LANDING_PAGE_VIEWED', {})
      }
    },
    {
      name: 'Lobby - Page Loaded',
      run: () => {
        amplitudeService.trackLobbyEvent('PAGE_LOADED', {
          available_machines: 5,
          user_coins: 100
        })
      }
    },
    {
      name: 'Lobby - Machine Selected',
      run: () => {
        amplitudeService.trackLobbyEvent('MACHINE_SELECTED', {
          machine_id: 'test-001',
          machine_name: 'Test Machine',
          machine_type: 'claw'
        })
      }
    },
    {
      name: 'Game - Game Started',
      run: () => {
        amplitudeService.trackGameEvent('GAME_STARTED', {
          machine_id: 'test-001',
          machine_name: 'Test Machine',
          coins_cost: 2,
          user_coins_before: 100
        })
      }
    },
    {
      name: 'Game - Control Used',
      run: () => {
        amplitudeService.trackGameEvent('CONTROL_USED', {
          machine_id: 'test-001',
          control_action: 'up',
          control_type: 'joystick'
        })
      }
    },
    {
      name: 'Game - Claw Dropped',
      run: () => {
        amplitudeService.trackGameEvent('CLAW_DROPPED', {
          machine_id: 'test-001',
          position_x: 50,
          position_y: 50
        })
      }
    },
    {
      name: 'Game - Prize Won',
      run: () => {
        amplitudeService.trackGameEvent('PRIZE_WON', {
          machine_id: 'test-001',
          coins_won: 10,
          prize_type: 'Blue Ball'
        })
      }
    },
    {
      name: 'Game - Game Ended',
      run: () => {
        amplitudeService.trackGameEvent('GAME_ENDED', {
          machine_id: 'test-001',
          result: 'win',
          coins_won: 10
        })
      }
    },
    {
      name: 'Profile - Page Viewed',
      run: () => {
        amplitudeService.trackProfileEvent('PAGE_VIEWED', {
          user_id: user?.id,
          user_level: 5,
          user_coins: 100,
          total_wins: 10,
          total_games: 50
        })
      }
    },
    {
      name: 'Profile - Name Change Clicked',
      run: () => {
        amplitudeService.trackProfileEvent('NAME_CHANGE_CLICKED', {
          source: 'test'
        })
      }
    },
    {
      name: 'Leaderboard - Viewed',
      run: () => {
        amplitudeService.trackLeaderboardEvent('VIEWED', {
          tab: 'wins',
          user_rank: 5
        })
      }
    },
    {
      name: 'Leaderboard - Tab Switched',
      run: () => {
        amplitudeService.trackLeaderboardEvent('TAB_SWITCHED', {
          from: 'wins',
          to: 'coins'
        })
      }
    },
    {
      name: 'Economy - Coins Spent',
      run: () => {
        amplitudeService.trackEconomyEvent('COINS_SPENT', {
          amount: 2,
          purpose: 'game',
          balance_before: 100,
          balance_after: 98
        })
      }
    },
    {
      name: 'Economy - Coins Earned',
      run: () => {
        amplitudeService.trackEconomyEvent('COINS_EARNED', {
          amount: 10,
          source: 'win',
          balance_before: 98,
          balance_after: 108
        })
      }
    },
    {
      name: 'Session - App Opened',
      run: () => {
        amplitudeService.trackSessionEvent('APP_OPENED', {})
      }
    }
  ]

  const runTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    for (const test of testEvents) {
      const result: TestResult = {
        name: test.name,
        status: 'pending'
      }

      try {
        // Run the test
        test.run()
        result.status = 'success'
      } catch (error) {
        result.status = 'failed'
        result.error = error instanceof Error ? error.message : 'Unknown error'
      }

      results.push(result)
      setTestResults([...results])
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsRunning(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Amplitude Tracking Test Suite</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Test all Amplitude event tracking implementations</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">User ID: {user?.id || 'Not logged in'}</p>
              <p className="text-sm text-gray-600">Total Tests: {testEvents.length}</p>
            </div>
            <button 
              onClick={runTests} 
              disabled={isRunning}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg hover:bg-neon-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="font-semibold text-lg">Test Results:</h3>
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : result.status === 'failed'
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700'
                  }`}
                >
                  <span className="font-medium">{result.name}</span>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {result.status === 'failed' && (
                      <>
                        <span className="text-sm text-red-600">{result.error}</span>
                        <XCircle className="h-5 w-5 text-red-600" />
                      </>
                    )}
                    {result.status === 'pending' && (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {testResults.length === testEvents.length && !isRunning && (
            <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p className="text-sm">
                Passed: {testResults.filter(r => r.status === 'success').length}/{testEvents.length}
              </p>
              <p className="text-sm">
                Failed: {testResults.filter(r => r.status === 'failed').length}/{testEvents.length}
              </p>
              <p className="text-sm mt-2 text-gray-600">
                Check your browser console and Amplitude dashboard to verify events are being sent correctly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
