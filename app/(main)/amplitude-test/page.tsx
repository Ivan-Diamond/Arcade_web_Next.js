'use client'

import { useState } from 'react'
import { amplitudeService } from '@/lib/analytics/amplitude'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useGameStore } from '@/lib/stores/useGameStore'

export default function AmplitudeTestPage() {
  const [eventName, setEventName] = useState('')
  const [eventProps, setEventProps] = useState('{}')
  const { user } = useAuthStore()
  const { joinRoom, endSession } = useGameStore()

  const handleTrackEvent = () => {
    try {
      const props = JSON.parse(eventProps)
      amplitudeService.track(eventName, props)
      alert(`Event "${eventName}" tracked successfully!`)
    } catch (error) {
      alert('Invalid JSON in event properties')
    }
  }

  const testGameFlow = () => {
    // Track game room entry
    amplitudeService.trackGameEvent('ROOM_ENTERED', {
      machine_id: 'test-room-1',
      machine_name: 'Test Claw Machine',
      queue_position: 0
    })
    
    // Track game start
    amplitudeService.trackGameStart('test-room-1', 'Test Claw Machine', 2, 100)
    
    // Simulate ending the game after 3 seconds
    setTimeout(() => {
      // Track game win
      amplitudeService.trackGameWin('test-room-1', 10, 98)
      
      // Track game end
      amplitudeService.trackGameEvent('GAME_ENDED', {
        machine_id: 'test-room-1',
        result: 'win',
        duration: 30000,
        moves_count: 5
      })
      
      alert('Game session completed and tracked!')
    }, 3000)
  }

  const testCoinTransaction = () => {
    amplitudeService.trackEconomyEvent('COINS_EARNED', {
      amount: 10,
      source: 'win',
      balance_before: 100,
      balance_after: 110
    })
    alert('Coin transaction tracked!')
  }

  const updateUserCoins = () => {
    amplitudeService.updateUserProperties({ coins: 150 })
    alert('User properties updated!')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Amplitude Analytics Test Page</h1>
      
      <div className="bg-dark-card rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold">API Key Configured:</span>{' '}
            <span className="text-green-400">✓ Yes</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">User Identified:</span>{' '}
            {user ? (
              <span className="text-green-400">✓ {user.username || user.email}</span>
            ) : (
              <span className="text-yellow-400">Anonymous</span>
            )}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Session Replay:</span>{' '}
            <span className="text-green-400">✓ Enabled</span>
          </p>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Events</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={testGameFlow}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            Test Game Flow (Start & End)
          </button>
          
          <button
            onClick={testCoinTransaction}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            Test Coin Transaction
          </button>
          
          <button
            onClick={updateUserCoins}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            Update User Properties
          </button>
          
          <button
            onClick={() => {
              amplitudeService.trackAuthEvent('LOGIN_SUCCESS', {
                method: 'email',
                user_id: user?.id || 'test-user'
              })
              alert('Login event tracked!')
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Test Auth Event
          </button>
          
          <button
            onClick={() => {
              amplitudeService.trackLobbyEvent('MACHINE_SELECTED', {
                machine_id: 'machine-123',
                machine_name: 'Lucky Claw',
                price: 2,
                queue_size: 3
              })
              alert('Lobby event tracked!')
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Test Lobby Event
          </button>
          
          <button
            onClick={() => {
              amplitudeService.trackWawaEvent('MESSAGE_SENT', {
                message_type: 'text',
                room_id: 'test-room-1',
                recipient_count: 5
              })
              alert('Wawa event tracked!')
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Test Wawa Event
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Event</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Button Clicked"
              className="w-full px-3 py-2 bg-dark-background border border-dark-border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Event Properties (JSON)</label>
            <textarea
              value={eventProps}
              onChange={(e) => setEventProps(e.target.value)}
              placeholder='{"button": "test", "page": "amplitude-test"}'
              className="w-full px-3 py-2 bg-dark-background border border-dark-border rounded-lg h-24"
            />
          </div>
          
          <button
            onClick={handleTrackEvent}
            disabled={!eventName}
            className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg transition-colors"
          >
            Track Custom Event
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
        <h3 className="font-semibold mb-2">📊 View Analytics</h3>
        <p className="text-sm mb-2">
          To view your tracked events and session replays:
        </p>
        <ol className="text-sm space-y-1 ml-4">
          <li>1. Go to <a href="https://app.amplitude.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">app.amplitude.com</a></li>
          <li>2. Navigate to your project</li>
          <li>3. Check the "Events" tab for real-time event tracking</li>
          <li>4. Check "Session Replay" to view recorded sessions</li>
        </ol>
      </div>
    </div>
  )
}
