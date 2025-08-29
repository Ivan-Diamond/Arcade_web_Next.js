import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';
import { Direction } from '@/types/joystick';

export interface BaseJoystickProps {
  startContinuousMove: (direction: WawaOptEnum) => void;
  stopContinuousMove: () => void;
  handleMove: (direction: WawaOptEnum) => void;
  disabled: boolean;
}

// Map from our Direction type to WawaOptEnum
export const directionToWawaOpt: Record<Direction, WawaOptEnum> = {
  up: WawaOptEnum.UP,
  down: WawaOptEnum.DOWN,
  left: WawaOptEnum.LEFT,
  right: WawaOptEnum.RIGHT,
};

// Helper function to get button position classes based on direction
export function getButtonPositionClasses(direction: Direction): string {
  switch (direction) {
    case 'up':
      return 'absolute top-0 left-1/2 -translate-x-1/2';
    case 'down':
      return 'absolute bottom-0 left-1/2 -translate-x-1/2';
    case 'left':
      return 'absolute left-0 top-1/2 -translate-y-1/2';
    case 'right':
      return 'absolute right-0 top-1/2 -translate-y-1/2';
  }
}

// Helper function to get button shape classes based on direction
export function getButtonShapeClasses(direction: Direction): string {
  switch (direction) {
    case 'up':
      return 'rounded-t-lg';
    case 'down':
      return 'rounded-b-lg';
    case 'left':
      return 'rounded-l-lg';
    case 'right':
      return 'rounded-r-lg';
  }
}
