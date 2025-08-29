'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Gamepad2, Coins, Target, Info } from 'lucide-react'

interface HowToPlayProps {
  gameName?: string
  machineName?: string
  price?: number
}

interface GameRules {
  title: string
  cost: number
  description: string
  objective: string
  rewards: string
  controls: string
  tips?: string
  color: string
  icon: any
}

export default function HowToPlay({ gameName, machineName, price = 10 }: HowToPlayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Determine game type and rules based on game name
  const getGameRules = (): GameRules => {
    const name = (gameName || machineName || '').toUpperCase()
    
    // Catch games (e.g., "Catch a Red", "Catch Blue")
    if (name.includes('CATCH')) {
      // Extract the main color from the game name
      const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'WHITE', 'BLACK']
      const mainColor = colors.find(color => name.includes(color)) || 'COLOR'
      
      return {
        title: `Catch ${mainColor.charAt(0) + mainColor.slice(1).toLowerCase()} Game`,
        cost: 5,
        description: `Catch balls to earn coins! Focus on ${mainColor.toLowerCase()} balls for maximum rewards.`,
        objective: 'Position the claw above balls and drop it at the right moment to grab them.',
        rewards: `• ${mainColor.charAt(0) + mainColor.slice(1).toLowerCase()} Ball (main color): 25 coins
• Any other colored ball: 10 coins`,
        controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab`,
        tips: `Focus on catching ${mainColor.toLowerCase()} balls for the highest rewards!`,
        color: 'border-neon-pink',
        icon: Gamepad2
      }
    }
    
    // Color games (separate from Catch games)
    if (name.includes('COLOR')) {
      return {
        title: 'Color Catch Game',
        cost: 5,
        description: 'Catch colorful balls to earn coins based on their color!',
        objective: 'Position the claw above a colored ball and drop it at the right moment to grab it.',
        rewards: `• 🟡 Yellow Ball: 30 coins
• 🟢 Green Ball: 25 coins  
• 🟣 Purple Ball: 20 coins
• 🔵 Blue Ball: 15 coins
• 🔴 Red Ball: 10 coins`,
        controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab`,
        tips: 'Aim for yellow balls for maximum rewards!',
        color: 'border-neon-pink',
        icon: Gamepad2
      }
    }
    
    if (name.includes('REBOUND')) {
      return {
        title: 'Rebound Challenge',
        cost: 0,
        description: 'Make the ball bounce into the target hole for big rewards!',
        objective: 'Grab a ball and drop it so it bounces off the platform into the scoring hole.',
        rewards: '• Ball lands in hole: 50 coins',
        controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab`,
        tips: 'Study the bounce angles and time your release carefully!',
        color: 'border-neon-green',
        icon: Target
      }
    }
    
    if (name.includes('PACHINKO')) {
      return {
        title: 'Pachinko Game',
        cost: 10,
        description: 'Navigate through pins for a chance at big rewards!',
        objective: 'Drop balls from the top and guide them through the pachinko board into the prize slot.',
        rewards: '• Prize slot: 25 coins',
        controls: `• ⬅️➡️ Position the drop point
• 🎯 Press CATCH to release`,
        tips: 'Watch how balls bounce off pins to find the best drop positions!',
        color: 'border-red-500',
        icon: Gamepad2
      }
    }
    
    if (name.includes('RANDOM') || name.includes('HOLE')) {
      return {
        title: 'Random Hole Game',
        cost: 5,
        description: 'Test your timing with randomly tilting holes!',
        objective: 'Position the claw above the moving holes and drop at the perfect moment.',
        rewards: '• Successfully drop into hole: 10 coins',
        controls: `• ⬆️⬇️ Move claw forward/back only
• 🎯 Press CATCH when aligned`,
        tips: 'Watch the hole movement pattern before dropping!',
        color: 'border-yellow-500',
        icon: Target
      }
    }
    
    if (name.includes('ALIEN') || name.includes('SHIP')) {
      return {
        title: 'Alien Ship Game',
        cost: 10,
        description: 'Capture balls and launch them into the alien ship!',
        objective: 'Grab a ball with the claw and throw it into the moving alien ship target.',
        rewards: '• Ball enters ship: 30 coins',
        controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab/release`,
        tips: 'Time your release when the ship is in position!',
        color: 'border-purple-500',
        icon: Gamepad2
      }
    }
    
    if (name.includes('SWEEPER')) {
      return {
        title: 'Sweeper Game',
        cost: 10,
        description: 'Navigate around the rotating sweeper rod!',
        objective: 'Avoid the rotating rod while positioning your claw to grab prizes.',
        rewards: '• Successfully grab prize: 20 coins',
        controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab`,
        tips: 'Watch the sweeper rotation pattern and move between sweeps!',
        color: 'border-blue-500',
        icon: Gamepad2
      }
    }
    
    // Default rules for unknown games
    return {
      title: 'Claw Machine',
      cost: 0,
      description: 'Test your skills in this exciting claw machine game!',
      objective: 'Use the controls to position and drop the claw to catch prizes.',
      rewards: '• Successful catch: 5 coins',
      controls: `• ⬅️➡️ Move claw left/right
• ⬆️⬇️ Move claw forward/back
• 🎯 Press CATCH to grab`,
      tips: 'Practice your timing and precision for better results!',
      color: 'border-neon-cyan',
      icon: Gamepad2
    }
  }
  
  const rules = getGameRules()
  const Icon = rules.icon
  
  return (
    <div className="card-neon p-6 mt-6">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border-2 ${rules.color} bg-dark-surface`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-neon-cyan">How to Play: {rules.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-500">
                Cost: {rules.cost === 0 ? 'FREE' : `${rules.cost} coins`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {isExpanded ? 'Hide' : 'Show'} Rules
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neon-cyan" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neon-cyan" />
          )}
        </div>
      </button>
      
      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          {/* Description */}
          <div className="p-4 bg-dark-surface/50 rounded-lg border border-neon-cyan/30">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-neon-cyan mt-0.5" />
              <div>
                <h3 className="font-semibold text-neon-cyan mb-2">Description</h3>
                <p className="text-gray-300">{rules.description}</p>
              </div>
            </div>
          </div>
          
          {/* Objective */}
          <div className="p-4 bg-dark-surface/50 rounded-lg border border-neon-pink/30">
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-neon-pink mt-0.5" />
              <div>
                <h3 className="font-semibold text-neon-pink mb-2">Objective</h3>
                <p className="text-gray-300">{rules.objective}</p>
              </div>
            </div>
          </div>
          
          {/* Rewards */}
          <div className="p-4 bg-dark-surface/50 rounded-lg border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <Coins className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-2">Rewards</h3>
                <div className="text-gray-300 whitespace-pre-line">{rules.rewards}</div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-4 bg-dark-surface/50 rounded-lg border border-neon-green/30">
            <div className="flex items-start gap-2">
              <Gamepad2 className="w-5 h-5 text-neon-green mt-0.5" />
              <div>
                <h3 className="font-semibold text-neon-green mb-2">Controls</h3>
                <div className="text-gray-300 whitespace-pre-line">{rules.controls}</div>
              </div>
            </div>
          </div>
          
          {/* Tips */}
          {rules.tips && (
            <div className="p-4 bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 rounded-lg border border-neon-purple/30">
              <div className="flex items-start gap-2">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-neon-purple mb-2">Pro Tip</h3>
                  <p className="text-gray-300">{rules.tips}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
