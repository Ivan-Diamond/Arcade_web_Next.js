'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Gamepad, Zap, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { roomService, type Machine, type LobbyData } from '@/lib/api/room-service'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { formatMachineName } from '@/lib/utils/formatMachineName'
import { GameRewards } from '@/lib/utils/gameRewards'
import { amplitudeService } from '@/lib/analytics/amplitude'

export default function LobbyPage() {
  const { data: session } = useSession()
  const { user } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleEnterRoom = (macNo: string) => {
    const machine = lobbyData?.machines?.find(m => m.macNo === macNo);
    if (machine) {
      amplitudeService.trackLobbyEvent('MACHINE_SELECTED', {
        machine_id: macNo,
        machine_name: machine.gameName,
        price: machine.price,
        queue_size: machine.inRoomCustomerAmount,
        status: machine.netStatus === 1 ? 'online' : 'offline'
      });
    }
    router.push(`/game-room/${macNo}`);
  };

  useEffect(() => {
    // Track lobby view
    amplitudeService.trackLobbyEvent('PAGE_LOADED', {
      available_machines: 0,
      user_coins: user?.coins || 0
    });
  }, []);

  useEffect(() => {
    const fetchLobbyData = async () => {
      if (!session?.user?.jwt) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await roomService.getLobbyData();
        if (data) {
          setLobbyData(data);
        } else {
          setError('Failed to load lobby data');
        }
      } catch (err) {
        setError('Failed to connect to server');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbyData();
  }, [session])

  const filteredMachines = lobbyData?.machines?.filter(machine => {
    return machine.gameName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || []

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
          Game Lobby
        </h1>
        <p className="text-gray-400">Choose your machine and start playing!</p>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        <StatCard
          icon={<Gamepad className="w-6 h-6" />}
          label="Available Machines"
          value={lobbyData?.machines?.filter(m => m.netStatus === 1).length || 0}
          color="cyan"
        />
        <StatCard
          icon={<Zap className="w-6 h-6" />}
          label="Your Coins"
          value={user?.coins || 0}
          color="green"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-cyan" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value) {
                amplitudeService.trackLobbyEvent('MACHINE_SEARCHED', {
                  query: e.target.value,
                  results_count: filteredMachines.length
                });
              }
            }}
            placeholder="Search machines..."
            className="input-neon pl-10 w-full"
          />
        </div>
      </motion.div>

      {/* Game Machines Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-neon h-64 animate-pulse">
              <div className="w-full h-32 bg-dark-surface rounded-lg mb-4" />
              <div className="h-4 bg-dark-surface rounded w-3/4 mb-2" />
              <div className="h-3 bg-dark-surface rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredMachines.map((machine) => (
            <MachineCard key={machine.macNo} machine={machine} onEnter={handleEnterRoom} />
          ))}
        </motion.div>
      )}

      {error && (
        <div className="text-center py-16">
          <AlertCircle className="w-24 h-24 text-red-500/30 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!error && filteredMachines.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Gamepad className="w-24 h-24 text-neon-cyan/30 mx-auto mb-4" />
          <p className="text-gray-400">No machines available</p>
        </div>
      )}
    </div>
  )
}

function MachineCard({ 
  machine, 
  onEnter 
}: { 
  machine: Machine;
  onEnter: (macNo: string) => void;
}) {
  const isOnline = machine.netStatus === 1;
  const hasQueue = machine.inRoomCustomerAmount > 0;

  // Map machine type/name to icon file
  const getMachineIcon = (machineName: string, machineType: string): string => {
    const nameUpper = machineName.toUpperCase();
    const typeUpper = machineType.toUpperCase();
    
    // Check for specific machine names first
    if (nameUpper.includes('BOOM') || nameUpper.includes('BALL')) {
      return '/app/images/machineIcons/BOOM_BALL.webp';
    }
    if (nameUpper.includes('CATCH') || nameUpper.includes('MATCH')) {
      return '/app/images/machineIcons/CATCH_MATCH.webp';
    }
    if (nameUpper.includes('LOLLIPOP') || nameUpper.includes('LOOP')) {
      return '/app/images/machineIcons/LOLLIPOP_LOOP.webp';
    }
    if (nameUpper.includes('MONSTER') || nameUpper.includes('FOREST')) {
      return '/app/images/machineIcons/MONSTER_FOREST.webp';
    }
    if (nameUpper.includes('ALIEN') || nameUpper.includes('COW')) {
      return '/app/images/machineIcons/alienCow.webp';
    }
    if (nameUpper.includes('HIT') && nameUpper.includes('CUP')) {
      return '/app/images/machineIcons/hitthecup1.webp';
    }
    if (nameUpper.includes('COLOR')) {
      return '/app/images/machineIcons/color_game_icon.webp';
    }
    if (nameUpper.includes('PACHINKO')) {
      return '/app/images/machineIcons/pachinko_icon.webp';
    }
    if (nameUpper.includes('RANDOM') || nameUpper.includes('HOLE')) {
      return '/app/images/machineIconsWide/random_hole_wide.webp';
    }
    if (nameUpper.includes('REBOUND')) {
      return '/app/images/machineIcons/rebound_game_icon.webp';
    }
    if (nameUpper.includes('SWEEP')) {
      return '/app/images/machineIcons/sweeper_icon.webp';
    }
    if (nameUpper.includes('ANIMATED')) {
      return '/app/images/machineIcons/moving_claw.webp';
    }
    
    // Check if it's a classic claw machine (CM_X pattern)
    if (nameUpper.startsWith('CM_') || typeUpper.includes('CLAW')) {
      return '/app/images/machineIcons/claw_machine.webp';
    }
    
    // Default to classic icon
    return '/app/images/machineIcons/classic_icon.webp';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="card-neon p-4 cursor-pointer"
      onClick={() => {
        amplitudeService.trackLobbyEvent('MACHINE_CARD_VIEWED', {
          machine_id: machine.macNo,
          machine_name: machine.gameName,
          status: isOnline ? 'online' : 'offline'
        });
        onEnter(machine.macNo);
      }}
    >
      {/* Machine Image */}
      <div className="relative w-full h-32 bg-dark-surface rounded-lg mb-3 overflow-hidden">
        <img 
          src={getMachineIcon(machine.gameName, machine.machineType)}
          alt={machine.gameName}
          className="w-full h-full object-contain p-2"
          onError={(e) => {
            e.currentTarget.src = '/app/images/machineIcons/classic_icon.webp';
          }}
        />
        
        {/* Status Badge */}
        {/* <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
          isOnline ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div> */}

        {/* Queue Badge */}
        {hasQueue && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500">
            {machine.inRoomCustomerAmount} in room
          </div>
        )}
      </div>

      {/* Machine Info */}
      <h3 className="font-semibold text-white mb-1 truncate">{formatMachineName(machine.gameName)}</h3>
      {/*<p className="text-sm text-gray-400 mb-2">{machine.machineType}</p>*/}
      
      {/* Cost and Reward */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-yellow-400">
          💰 {machine.price} coins
        </span>
        <span className="text-green-400">
          🏆 {GameRewards.getMaxWinAmount(machine.gameName)} coins
        </span>
      </div>

      {/* Play Time */}
      <div className="mt-2 text-xs text-gray-500">
        ⏱️ {machine.during}s play time
      </div>
    </motion.div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'cyan' | 'purple' | 'green'
}) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan',
    purple: 'text-neon-purple border-neon-purple',
    green: 'text-neon-green border-neon-green',
  }

  return (
    <div className={`card-neon border ${colorClasses[color]} flex items-center gap-4 p-4`}>
      <div className={colorClasses[color]}>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}
