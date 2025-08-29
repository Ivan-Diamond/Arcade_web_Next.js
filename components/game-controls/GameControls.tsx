'use client';

import React from 'react';
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';
import { getJoystickType } from './utils/joystickSelector';
import { StandardJoystick } from './joysticks/StandardJoystick';
import { RandomHoleJoystick } from './joysticks/RandomHoleJoystick';
import { PachinkoJoystick } from './joysticks/PachinkoJoystick';

interface GameControlsProps {
  machineName?: string;
  startContinuousMove: (direction: WawaOptEnum) => void;
  stopContinuousMove: () => void;
  handleMove: (direction: WawaOptEnum) => void;
  disabled: boolean;
}

export function GameControls({
  machineName,
  startContinuousMove,
  stopContinuousMove,
  handleMove,
  disabled,
}: GameControlsProps) {
  const joystickConfig = getJoystickType(machineName);
  
  // Debug logging to verify machine name
  console.log('GameControls - machineName:', machineName);
  console.log('GameControls - joystickConfig:', joystickConfig);
  
  const commonProps = {
    startContinuousMove,
    stopContinuousMove,
    handleMove,
    disabled,
  };

  // Render the appropriate joystick variant
  switch (joystickConfig.type) {
    case 'randomHole':
      return <RandomHoleJoystick {...commonProps} />;
    case 'pachinko':
      return <PachinkoJoystick {...commonProps} />;
    case 'standard':
    default:
      return <StandardJoystick {...commonProps} />;
  }
}
