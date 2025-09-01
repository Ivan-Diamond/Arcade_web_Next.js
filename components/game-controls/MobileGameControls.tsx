'use client'

import React, { useState, useRef, useEffect } from 'react'
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Grab, Camera, SwitchCamera } from 'lucide-react'

interface MobileGameControlsProps {
  startContinuousMove: (direction: WawaOptEnum) => void
  stopContinuousMove: () => void
  handleMove: (direction: WawaOptEnum) => void
  onSwitchCamera?: () => void
  disabled: boolean
  currentCamera: 0 | 1
}

export function MobileGameControls({
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  onSwitchCamera,
  disabled,
  currentCamera,
}: MobileGameControlsProps) {
  const [activeButton, setActiveButton] = useState<WawaOptEnum | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const joystickRef = useRef<HTMLDivElement>(null)
  
  // Handle touch controls for continuous movement
  const handleTouchStart = (direction: WawaOptEnum) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (disabled) return
    setActiveButton(direction)
    startContinuousMove(direction)
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setActiveButton(null)
    stopContinuousMove()
  }
  
  // Handle grab button
  const handleGrab = () => {
    if (disabled) return
    handleMove(WawaOptEnum.GRAB)
    
    // Stronger haptic feedback for grab
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 20, 50])
    }
  }
  
  // Virtual joystick for movement
  const handleJoystickTouch = (e: React.TouchEvent) => {
    if (disabled || !joystickRef.current) return
    
    const touch = e.touches[0]
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = touch.clientX - centerX
    const deltaY = touch.clientY - centerY
    
    const threshold = 30 // pixels from center to trigger movement
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > threshold) {
        startContinuousMove(WawaOptEnum.RIGHT)
        setActiveButton(WawaOptEnum.RIGHT)
      } else if (deltaX < -threshold) {
        startContinuousMove(WawaOptEnum.LEFT)
        setActiveButton(WawaOptEnum.LEFT)
      }
    } else {
      // Vertical movement
      if (deltaY > threshold) {
        startContinuousMove(WawaOptEnum.DOWN) // Inverted for claw machine
        setActiveButton(WawaOptEnum.DOWN)
      } else if (deltaY < -threshold) {
        startContinuousMove(WawaOptEnum.UP) // Inverted for claw machine
        setActiveButton(WawaOptEnum.UP)
      }
    }
  }
  
  const handleJoystickTouchEnd = () => {
    setActiveButton(null)
    stopContinuousMove()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-md border-t border-neon-cyan/30 p-4 md:hidden">
      {/* Camera switch button - top row */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onSwitchCamera}
          disabled={disabled}
          className="px-3 py-2 bg-dark-surface/80 rounded-lg border border-neon-purple/50 
                   flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>{currentCamera === 0 ? 'Front' : 'Side'}</span>
          <SwitchCamera className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Virtual Joystick */}
        <div className="relative">
          <div 
            ref={joystickRef}
            className="w-32 h-32 relative"
            onTouchMove={handleJoystickTouch}
            onTouchEnd={handleJoystickTouchEnd}
          >
            {/* Joystick background */}
            <div className="absolute inset-0 rounded-full bg-dark-surface/50 border-2 border-neon-cyan/30" />
            
            {/* Direction indicators */}
            <button
              onTouchStart={handleTouchStart(WawaOptEnum.UP)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
              className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 
                       rounded-full flex items-center justify-center
                       ${activeButton === WawaOptEnum.UP 
                         ? 'bg-neon-cyan text-black scale-110' 
                         : 'bg-dark-surface/80 text-neon-cyan'}
                       disabled:opacity-50 transition-all`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            
            <button
              onTouchStart={handleTouchStart(WawaOptEnum.DOWN)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 
                       rounded-full flex items-center justify-center
                       ${activeButton === WawaOptEnum.DOWN 
                         ? 'bg-neon-cyan text-black scale-110' 
                         : 'bg-dark-surface/80 text-neon-cyan'}
                       disabled:opacity-50 transition-all`}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            
            <button
              onTouchStart={handleTouchStart(WawaOptEnum.LEFT)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
              className={`absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 
                       rounded-full flex items-center justify-center
                       ${activeButton === WawaOptEnum.LEFT 
                         ? 'bg-neon-cyan text-black scale-110' 
                         : 'bg-dark-surface/80 text-neon-cyan'}
                       disabled:opacity-50 transition-all`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onTouchStart={handleTouchStart(WawaOptEnum.RIGHT)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 
                       rounded-full flex items-center justify-center
                       ${activeButton === WawaOptEnum.RIGHT 
                         ? 'bg-neon-cyan text-black scale-110' 
                         : 'bg-dark-surface/80 text-neon-cyan'}
                       disabled:opacity-50 transition-all`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-4 h-4 rounded-full bg-neon-cyan/50" />
          </div>
        </div>
        
        {/* Right side - Grab button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handleGrab()
          }}
          disabled={disabled}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1
                   ${disabled 
                     ? 'bg-gray-700/50 text-gray-500' 
                     : 'bg-gradient-to-br from-neon-pink to-neon-purple text-white active:scale-95'}
                   shadow-lg transition-all font-bold text-lg`}
        >
          <Grab className="w-8 h-8" />
          <span className="text-xs">GRAB</span>
        </button>
      </div>
      
      {/* Game status indicator */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">
          {disabled ? 'Waiting for your turn...' : 'Swipe or tap to control'}
        </p>
      </div>
    </div>
  )
}
