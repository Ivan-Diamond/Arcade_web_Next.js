'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';
import { BaseJoystickProps, directionToWawaOpt } from './BaseJoystick';

export function PachinkoJoystick({
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  disabled,
}: BaseJoystickProps) {
  return (
    <div className="space-y-6">
      {/* Horizontal-only D-Pad */}
      <div className="relative w-48 h-24 mx-auto flex items-center justify-center">
        {/* Left button */}
        <button
          onMouseDown={() => startContinuousMove(directionToWawaOpt.left)}
          onMouseUp={stopContinuousMove}
          onMouseLeave={stopContinuousMove}
          onTouchStart={() => startContinuousMove(directionToWawaOpt.left)}
          onTouchEnd={stopContinuousMove}
          disabled={disabled}
          className="absolute left-0 w-16 h-16
                     bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                     rounded-l-lg border border-neon-cyan/50
                     flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-neon-cyan" />
        </button>
        
        {/* Center spacer */}
        <div className="w-16 h-16 bg-dark-surface/50 rounded-lg
                        border border-neon-cyan/30" />
        
        {/* Right button */}
        <button
          onMouseDown={() => startContinuousMove(directionToWawaOpt.right)}
          onMouseUp={stopContinuousMove}
          onMouseLeave={stopContinuousMove}
          onTouchStart={() => startContinuousMove(directionToWawaOpt.right)}
          onTouchEnd={stopContinuousMove}
          disabled={disabled}
          className="absolute right-0 w-16 h-16
                     bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
                     rounded-r-lg border border-neon-cyan/50
                     flex items-center justify-center transition-all"
        >
          <ArrowRight className="w-6 h-6 text-neon-cyan" />
        </button>
      </div>
      
      {/* Catch Button */}
      <button
        onClick={() => handleMove(WawaOptEnum.GRAB)}
        disabled={disabled}
        className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-purple
                   hover:shadow-neon-pink disabled:opacity-50 disabled:hover:shadow-none
                   rounded-lg font-bold text-lg transition-all
                   flex items-center justify-center gap-2"
      >
        <Circle className="w-6 h-6" />
        CATCH
      </button>
      
      {/* Info text for Pachinko games */}
      <div className="text-center text-sm text-gray-400">
        Horizontal movement only
      </div>
    </div>
  );
}
