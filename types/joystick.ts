export type Direction = 'up' | 'down' | 'left' | 'right';

export interface JoystickBehaviors {
  delayedInteraction?: number; // Delay in milliseconds before joystick becomes interactive
  conditionalButtons?: {
    [key in Direction]?: {
      showAfter: 'clawPress';
    };
  };
}

export interface JoystickVariant {
  name: string;
  type: 'standard' | 'randomHole' | 'pachinko';
  availableDirections: Set<Direction>;
  clawButton: boolean;
  behaviors?: JoystickBehaviors;
}

// Joystick configurations
export const STANDARD_JOYSTICK_CONFIG: JoystickVariant = {
  name: 'Standard Joystick',
  type: 'standard',
  availableDirections: new Set<Direction>(['up', 'down', 'left', 'right']),
  clawButton: true,
};

export const RANDOM_HOLE_JOYSTICK_CONFIG: JoystickVariant = {
  name: 'Random Hole Joystick',
  type: 'randomHole',
  availableDirections: new Set<Direction>(['up', 'down', 'left', 'right']),
  clawButton: true,
  behaviors: {
    delayedInteraction: 2000, // 2 seconds delay
    conditionalButtons: {
      'left': { showAfter: 'clawPress' },
      'right': { showAfter: 'clawPress' },
    },
  },
};

export const PACHINKO_JOYSTICK_CONFIG: JoystickVariant = {
  name: 'Pachinko Joystick',
  type: 'pachinko',
  availableDirections: new Set<Direction>(['left', 'right']),
  clawButton: true,
};
