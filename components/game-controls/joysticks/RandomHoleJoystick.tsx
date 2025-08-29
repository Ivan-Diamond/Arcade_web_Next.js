'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';
import { BaseJoystickProps, directionToWawaOpt, getButtonPositionClasses, getButtonShapeClasses } from './BaseJoystick';
import { Direction } from '@/types/joystick';

export function RandomHoleJoystick({
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  disabled,
}: BaseJoystickProps) {
  const [isInteractive, setIsInteractive] = useState(false);
  const [clawPressed, setClawPressed] = useState(false);

  // Enable interaction after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInteractive(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClawPress = () => {
    if (!isInteractive || disabled) return;
    handleMove(WawaOptEnum.GRAB);
    setClawPressed(true);
  };

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

  const renderDirectionButton = (direction: Direction) => {
    const isDisabled = disabled || !isInteractive;
    
    return (
      <button
        key={direction}
        onMouseDown={() => !isDisabled && startContinuousMove(directionToWawaOpt[direction])}
        onMouseUp={stopContinuousMove}
        onMouseLeave={stopContinuousMove}
        onTouchStart={() => !isDisabled && startContinuousMove(directionToWawaOpt[direction])}
        onTouchEnd={stopContinuousMove}
        disabled={isDisabled}
        className={`
          ${getButtonPositionClasses(direction)}
          w-16 h-16
          bg-dark-surface hover:bg-neon-cyan/20
          ${getButtonShapeClasses(direction)} border border-neon-cyan/50
          flex items-center justify-center transition-all
          ${!isInteractive ? 'opacity-50 pointer-events-none' : ''}
          ${isDisabled ? 'opacity-50' : ''}
        `}
      >
        {getArrowIcon(direction)}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* D-Pad with conditional buttons */}
      <div className="relative w-48 h-48 mx-auto">
        {/* Always visible: Up and Down */}
        {renderDirectionButton('up')}
        {renderDirectionButton('down')}
        
        {/* Conditionally visible: Left and Right (appear after claw press) */}
        {clawPressed && (
          <>
            {renderDirectionButton('left')}
            {renderDirectionButton('right')}
          </>
        )}
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-16 h-16 bg-dark-surface/50 rounded-lg
                        border border-neon-cyan/30" />
      </div>
      
      {/* Catch Button with delayed interaction */}
      <button
        onClick={handleClawPress}
        disabled={disabled || !isInteractive}
        className={`
          w-full py-4 bg-gradient-to-r from-neon-pink to-neon-purple
          hover:shadow-neon-pink disabled:hover:shadow-none
          rounded-lg font-bold text-lg transition-all
          flex items-center justify-center gap-2
          ${!isInteractive ? 'opacity-50 pointer-events-none' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        <Circle className="w-6 h-6" />
        CATCH
      </button>

      {/* Visual feedback for delay */}
      {!isInteractive && (
        <div className="text-center text-sm text-gray-400">
          Controls activating...
        </div>
      )}
    </div>
  );
}
