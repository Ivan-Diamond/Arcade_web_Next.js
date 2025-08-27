// Game control enums and types
export enum WawaOptEnum {
  UP = 0,    // front/back - up movement
  DOWN = 1,  // front/back - down movement  
  LEFT = 2,  // left movement
  RIGHT = 3, // right movement
  GRAB = 4,  // claw grab action
  IDLE = 5   // idle state
}

export interface GameState {
  isPlaying: boolean
  gameTimer: number
  ballCount: number
  playerCount: number
  totalGold?: number
  totalScore?: number
}

export interface MachineInfo {
  macNo: string
  gameName: string
  camera0Url: string
  camera1Url: string
  imgFileName: string
  machineType: string
  protocolVersion: number
  price: number
  during: number
  netStatus: number
  inRoomCustomerAmount: number
  enableGiveNewPlayer: boolean
  isDemo: boolean
  winAmount: number
  isWinGetGold: number
  ballCount: number
}
