'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';
import { BaseJoystickProps, directionToWawaOpt, getButtonPositionClasses, getButtonShapeClasses } from './BaseJoystick';
import { Direction } from '@/types/joystick';

export function StandardJoystick({
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  disabled,
}: BaseJoystickProps) {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];

  const getArrowIcon = (direction: Direction) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-6 h-6 text-neon-cyan" />;
      case 'down':
        return <ArrowDown className="w-6 h-6 text-neon-cyan" />;
      case 'left':
        return <ArrowLeft className="w-6 h-6 text-neon-cyan" />;
      case 'right':
        return <ArrowRight className="w-6 h-6 text-neon-cyan" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* D-Pad */}
      <div className="relative w-48 h-48 mx-auto">
        {directions.map((direction) => (
          <button
            key={direction}
            onMouseDown={() => startContinuousMove(directionToWawaOpt[direction])}
            onMouseUp={stopContinuousMove}
            onMouseLeave={stopContinuousMove}
            onTouchStart={() => startContinuousMove(directionToWawaOpt[direction])}
            onTouchEnd={stopContinuousMove}
            disabled={disabled}
            className={`
              ${getButtonPositionClasses(direction)}
              w-16 h-16
              bg-dark-surface hover:bg-neon-cyan/20 disabled:opacity-50
              ${getButtonShapeClasses(direction)} border border-neon-cyan/50
              flex items-center justify-center transition-all
            `}
          >
            {getArrowIcon(direction)}
          </button>
        ))}
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-16 h-16 bg-dark-surface/50 rounded-lg
                        border border-neon-cyan/30" />
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
    </div>
  );
}
