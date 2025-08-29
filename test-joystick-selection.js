// Test script to verify joystick selection logic
import { getJoystickType } from './components/game-controls/utils/joystickSelector.js';

const testCases = [
  { name: 'Random Hole Game 1', expected: 'randomHole' },
  { name: 'randomhole_special', expected: 'randomHole' },
  { name: 'RH_Machine_01', expected: 'randomHole' },
  { name: 'Pachinko Master', expected: 'pachinko' },
  { name: 'PCH_Game_2024', expected: 'pachinko' },
  { name: 'Standard Claw Machine', expected: 'standard' },
  { name: 'Regular Game', expected: 'standard' },
  { name: undefined, expected: 'standard' },
];

console.log('Testing Joystick Selection Logic:\n');
testCases.forEach(({ name, expected }) => {
  const result = getJoystickType(name);
  const passed = result.type === expected;
  console.log(`Machine: "${name || 'undefined'}" -> ${result.type} ${passed ? '✓' : '✗ (expected: ' + expected + ')'}`);
});
