import protobuf from 'protobufjs'

export enum WawaOptEnum {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  GRAB = 4,
}

export enum PackageType {
  LOGIN = 0,
  SENDMESSAGETOROOMMATE = 1,
  STARTGAMEMESSAGE = 2,
  ARMMOVEMESSAGE = 3,
  HEARTMESSAGE = 4,
  GAMERESULTMESSAGE = 5,
  BALLCOUNTMESSAGE = 6,
  SCOREMESSAGE = 7,
  ENTERROOMMESSAGE = 8,
  EXITROOMMESSAGE = 9,
  NUMBEROfPEOPLEINTHEROOMMESSAGE = 10,
  WAWAMOVEMESSAGE = 11,
  WAWARESULTMESSAGE = 12,
}

class ProtobufSocketClient {
  private ws: WebSocket | null = null
  private root: protobuf.Root | null = null
  private DataPackage: protobuf.Type | null = null
  private userId: string | null = null
  private socketPassword: string | null = null
  private macNo: string | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  
  // Event handlers
  public onOpen: (() => void) | null = null
  public onClose: (() => void) | null = null
  public onError: ((error: Event) => void) | null = null
  public onMessage: ((data: any) => void) | null = null
  public onPlayerCount: ((count: number) => void) | null = null
  public onGameResult: ((result: any) => void) | null = null
  public onEnterRoomResult: ((data: any) => void) | null = null

  constructor() {
    this.loadProto()
  }

  private async loadProto() {
    try {
      // Load proto definition
      const response = await fetch('/proto/CustomerNettyProto.proto')
      const protoContent = await response.text()
      
      this.root = protobuf.parse(protoContent).root
      this.DataPackage = this.root.lookupType('DataPackage')
      console.log('Protobuf definitions loaded successfully')
    } catch (error) {
      console.error('Failed to load protobuf definitions:', error)
    }
  }

  public async connect(userId: string, socketPassword: string, macNo?: string) {
    if (!this.root || !this.DataPackage) {
      console.error('Protobuf not loaded yet, retrying...')
      await this.loadProto()
      if (!this.root || !this.DataPackage) {
        throw new Error('Failed to load protobuf definitions')
      }
    }

    this.userId = userId
    this.socketPassword = socketPassword
    this.macNo = macNo || ''

    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://206.81.25.143:59199/ws'
    
    console.log('Connecting to WebSocket:', wsUrl)
    
    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.login()
      this.startHeartbeat()
      this.onOpen?.()
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.stopHeartbeat()
      this.onClose?.()
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.onError?.(error)
    }

    this.ws.onmessage = async (event) => {
      try {
        const buffer = new Uint8Array(event.data)
        const message = this.DataPackage!.decode(buffer)
        const object = this.DataPackage!.toObject(message, {
          longs: String,
          enums: String,
          bytes: String,
        })
        
        console.log('Received message:', object)
        
        // Handle specific message types
        if (object.packageType === 'NUMBEROfPEOPLEINTHEROOMMESSAGE' && object.numberOfPeopleInTheRoomMessage) {
          this.onPlayerCount?.(object.numberOfPeopleInTheRoomMessage.numberOfPeopleInTheRoom)
        } else if (object.packageType === 'GAMERESULTMESSAGE' && object.gameResultMessage) {
          this.onGameResult?.(object.gameResultMessage)
        } else if (object.packageType === 'ENTERROOMMESSAGE' && object.enterRoomMessage) {
          this.onEnterRoomResult?.(object.enterRoomMessage)
        } else if (object.packageType === 'LOGIN' && object.loginMessage) {
          if (object.loginMessage.loginResult) {
            console.log('Login successful')
          } else {
            console.error('Login failed')
          }
        }
        
        this.onMessage?.(object)
      } catch (error) {
        console.error('Error decoding protobuf message:', error)
      }
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`)
      setTimeout(() => {
        if (this.userId && this.socketPassword) {
          this.connect(this.userId, this.socketPassword, this.macNo || undefined)
        }
      }, this.reconnectDelay)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private sendMessage(packageType: PackageType, messageType: string, messageData: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    if (!this.DataPackage) {
      console.error('Protobuf not loaded')
      return
    }

    try {
      const message = this.DataPackage.create({
        packageType,
        [messageType]: messageData,
      })

      const buffer = this.DataPackage.encode(message).finish()
      this.ws.send(buffer)
      console.log(`Sent ${messageType}:`, messageData)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  public login() {
    this.sendMessage(PackageType.LOGIN, 'loginMessage', {
      userID: this.userId,
      tempPasswd: this.socketPassword,
      isServerSide: false,
      loginResult: false,
    })
  }

  public enterRoom(macNo: string) {
    this.macNo = macNo
    this.sendMessage(PackageType.ENTERROOMMESSAGE, 'enterRoomMessage', {
      userID: this.userId,
      macNo: macNo,
      webrtcClientID: '',
      isServerSide: false,
    })
  }

  public exitRoom() {
    if (!this.macNo) return
    
    this.sendMessage(PackageType.EXITROOMMESSAGE, 'exitRoomMessage', {
      userID: this.userId,
      macNo: this.macNo,
      isServerSide: false,
      webrtcClientID: '',
    })
  }

  public startGame() {
    if (!this.macNo) {
      console.error('No machine selected')
      return
    }

    this.sendMessage(PackageType.STARTGAMEMESSAGE, 'startGameMessage', {
      userID: this.userId,
      macNo: this.macNo,
      isServerSide: false,
    })
  }

  public sendWawaMove(direction: WawaOptEnum) {
    if (!this.macNo) {
      console.error('No machine selected')
      return
    }

    this.sendMessage(PackageType.WAWAMOVEMESSAGE, 'wawaMoveMessage', {
      userID: this.userId,
      macNo: this.macNo,
      data: direction,
    })
  }

  public sendArmMove(armSide: number) {
    if (!this.macNo) {
      console.error('No machine selected')
      return
    }

    this.sendMessage(PackageType.ARMMOVEMESSAGE, 'armMoveMessage', {
      userID: this.userId,
      macNo: this.macNo,
      data: armSide, // 0 = left arm, 1 = right arm
    })
  }

  private sendHeartbeat() {
    this.sendMessage(PackageType.HEARTMESSAGE, 'heartMessage', {
      userID: this.userId,
    })
  }

  public disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
let instance: ProtobufSocketClient | null = null

export function getProtobufSocketClient(): ProtobufSocketClient {
  if (!instance) {
    instance = new ProtobufSocketClient()
  }
  return instance
}

export default ProtobufSocketClient
