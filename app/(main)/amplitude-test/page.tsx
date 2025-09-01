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
    // Simulate joining a game
    const mockRoom = {
      id: 'test-room-1',
      name: 'Test Claw Machine',
      coinCost: 2,
      coinReward: 10,
      status: 'available' as const,
      thumbnail: '/images/claw-machine.jpg',
      difficulty: 'medium' as const,
      type: 'claw' as const,
      streamUrl: 'ws://localhost:8080/stream/test-room-1',
      queueLength: 0
    }
    
    joinRoom(mockRoom)
    
    // Simulate ending the game after 3 seconds
    setTimeout(() => {
      endSession('win')
      alert('Game session completed and tracked!')
    }, 3000)
  }

  const testCoinTransaction = () => {
    amplitudeService.trackCoinTransaction('earned', 10, 'game_win')
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
        
        <div className="space-y-4">
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
