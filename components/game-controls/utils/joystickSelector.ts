import { JoystickVariant, STANDARD_JOYSTICK_CONFIG, RANDOM_HOLE_JOYSTICK_CONFIG, PACHINKO_JOYSTICK_CONFIG } from '@/types/joystick';

/**
 * Determines which joystick variant to use based on the machine/game name
 * @param machineName - The name of the machine or game
 * @returns The appropriate joystick configuration
 */
export function getJoystickType(machineName?: string): JoystickVariant {
  if (!machineName) {
    return STANDARD_JOYSTICK_CONFIG;
  }
  
  const nameLower = machineName.toLowerCase();
  
  // Check for Random Hole games
  if (nameLower.includes('random') && nameLower.includes('hole')) {
    return RANDOM_HOLE_JOYSTICK_CONFIG;
  }
  if (nameLower.includes('randomhole')) {
    return RANDOM_HOLE_JOYSTICK_CONFIG;
  }
  if (nameLower.includes('rh_')) {
    return RANDOM_HOLE_JOYSTICK_CONFIG;
  }
  
  // Check for Pachinko games
  if (nameLower.includes('pachinko')) {
    return PACHINKO_JOYSTICK_CONFIG;
  }
  if (nameLower.includes('pch_')) {
    return PACHINKO_JOYSTICK_CONFIG;
  }
  
  // Default to standard joystick
  return STANDARD_JOYSTICK_CONFIG;
}
