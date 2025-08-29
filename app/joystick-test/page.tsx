'use client';

import React, { useState } from 'react';
import { GameControls } from '@/components/game-controls/GameControls';
import { WawaOptEnum } from '@/lib/socket/protobuf-socket-client';

export default function JoystickTestPage() {
  const [selectedVariant, setSelectedVariant] = useState('Standard Game');
  
  const testMachines = [
    { name: 'Standard Game', type: 'standard' },
    { name: 'Random Hole Game', type: 'randomHole' },
    { name: 'Pachinko Master', type: 'pachinko' },
    { name: 'RH_Machine_01', type: 'randomHole' },
    { name: 'PCH_Game_2024', type: 'pachinko' },
  ];

  const mockHandlers = {
    startContinuousMove: (direction: WawaOptEnum) => {
      console.log('Start continuous move:', direction);
    },
    stopContinuousMove: () => {
      console.log('Stop continuous move');
    },
    handleMove: (direction: WawaOptEnum) => {
      console.log('Handle move:', direction);
    },
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-neon-cyan">Joystick Variants Test</h1>
        
        {/* Machine Selector */}
        <div className="mb-8">
          <label className="block text-lg font-medium mb-4">Select Machine Type:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {testMachines.map((machine) => (
              <button
                key={machine.name}
                onClick={() => setSelectedVariant(machine.name)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedVariant === machine.name
                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                    : 'bg-dark-surface border-gray-600 hover:border-neon-cyan/50'
                }`}
              >
                <div className="font-medium">{machine.name}</div>
                <div className="text-sm text-gray-400">({machine.type})</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection Info */}
        <div className="mb-8 p-4 bg-dark-surface rounded-lg">
          <h2 className="text-xl font-bold mb-2">Current Selection:</h2>
          <p className="text-neon-cyan">{selectedVariant}</p>
        </div>

        {/* Joystick Display */}
        <div className="bg-dark-surface rounded-lg p-8">
          <h2 className="text-xl font-bold mb-6 text-center">Joystick Controls</h2>
          <GameControls
            machineName={selectedVariant}
            startContinuousMove={mockHandlers.startContinuousMove}
            stopContinuousMove={mockHandlers.stopContinuousMove}
            handleMove={mockHandlers.handleMove}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
