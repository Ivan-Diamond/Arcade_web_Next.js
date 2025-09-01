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
  PLAYGAMEORDER = 13,
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
  public onOpen?: () => void
  public onClose?: () => void
  public onConnect?: () => void
  public onDisconnect?: () => void
  public onQueueUpdate?: (playGameOrder: any) => void
  public onRoomMessage?: (message: any) => void
  public onMessage?: (data: any) => void
  public onPlayerCount?: (count: number) => void
  public onGameResult?: (result: any) => void
  public onEnterRoomResult?: (result: any) => void
  public onWawaResult?: (result: any) => void
  public onBallCount?: (result: any) => void
  public onScore?: (result: any) => void
  public onStartGameResult?: (result: any) => void
  public onError?: (error: any) => void

  constructor() {
    this.loadProto()
  }

  private async loadProto() {
    try {
      // Embed protobuf definition directly to avoid path issues
      const protoContent = `
syntax = "proto3";

message DataPackage{
     PackageType packageType = 1;
     oneof Package{
          LoginMessage loginMessage = 2;
          SendMessageToRoomMate sendMessageToRoomMate = 3;
         StartGameMessage startGameMessage = 4;
         ArmMoveMessage armMoveMessage = 5;
         HeartMessage heartMessage = 6;
         GameResultMessage gameResultMessage = 7;
       BallCountMessage ballCountMessage = 8;
         ScoreMessage scoreMessage = 9;
         EnterRoomMessage enterRoomMessage = 10;
         ExitRoomMessage exitRoomMessage = 11;
         NumberOfPeopleInTheRoomMessage numberOfPeopleInTheRoomMessage =12;
         WawaMoveMessage wawaMoveMessage= 13;
         WawaResultMessage wawaResultMessage=14;
         PlayGameOrder playGameOrder=15;
     }
}

enum PackageType{
     LOGIN = 0;
    SENDMESSAGETOROOMMATE = 1;
    STARTGAMEMESSAGE = 2;
    ARMMOVEMESSAGE = 3;
    HEARTMESSAGE = 4;
    GAMERESULTMESSAGE = 5;
    BALLCOUNTMESSAGE =6;
    SCOREMESSAGE = 7;
    ENTERROOMMESSAGE = 8;
    EXITROOMMESSAGE = 9;
    NUMBEROfPEOPLEINTHEROOMMESSAGE = 10;
    WAWAMOVEMESSAGE=11;
    WAWARESULTMESSAGE=12;
    PLAYGAMEORDER=13;
}

message LoginMessage {
     int64 userID = 1;
    string tempPasswd = 2;
    bool isServerSide = 3;
    bool loginResult =4;
}

message SendMessageToRoomMate{
     int64 senderUserID = 1;
    string roomID = 2;
     string msgData = 3;
  string senderUserName = 4;
}

message StartGameMessage {
  int64 userID = 1;
  string macNo = 2;
  bool isServerSide = 3;
  int32 startGameResult = 4;
  string des = 5;
  int32 ballCount = 6;
  int64 totalGold = 7;
  int64 totalScore = 8;
  int32 gameDuring = 9;
}

message ArmMoveMessage {
  int64 userID = 1;
  string macNo = 2;
    int32  data = 3;
}

message HeartMessage {
  int64 userID = 1;
}

message GameResultMessage {
  int64 userID = 1;
  string macNo = 2;
  int32 gameFinishFlag =3;
  int64 totalGold = 4;
  int64 totalScore = 5;
}

message BallCountMessage{
  int64 userID = 1;
  string macNo = 2;
  int32 ballCount = 3;
}

message ScoreMessage{
  int64 userID = 1;
  string macNo = 2;
  int32 score = 3;
  int64 inCome = 4;
}

message EnterRoomMessage{
  int64 userID = 1;
  string macNo = 2;
  int64 totalGold = 3;
  int64 totalScore = 4;
  bool isServerSide = 5;
  string webrtcClientID = 6;
  bool isMeOperation = 7;
  int32 playTimes=8;
}

message ExitRoomMessage{
  int64 userID = 1;
  string macNo = 2;
  bool isServerSide = 3;
  string webrtcClientID = 4;
}

message NumberOfPeopleInTheRoomMessage{
  string macNo = 1;
  int32 numberOfPeopleInTheRoom = 2;
}

message WawaMoveMessage {
  int64 userID = 1;
  string macNo = 2;
  int32  data = 3;
}

message WawaResultMessage {
  int64 userID = 1;
  string macNo = 2;
  int32  data = 3;
}

message PlayGameOrder {
  int64 userID = 1;
  string macNo = 2;
  int32 order = 3;
}
`
      
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

    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss://msaarcade.com/ws' : 'ws://206.81.25.143:59199/ws')
    
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
        } else if (object.packageType === 'WAWARESULTMESSAGE' && object.wawaResultMessage) {
          this.onWawaResult?.(object.wawaResultMessage)
        } else if (object.packageType === 'BALLCOUNTMESSAGE' && object.ballCountMessage) {
          this.onBallCount?.(object.ballCountMessage)
        } else if (object.packageType === 'SCOREMESSAGE' && object.scoreMessage) {
          this.onScore?.(object.scoreMessage)
        } else if (object.packageType === 'ENTERROOMMESSAGE' && object.enterRoomMessage) {
          this.onEnterRoomResult?.(object.enterRoomMessage)
        } else if (object.packageType === 'LOGIN' && object.loginMessage) {
          if (object.loginMessage.loginResult) {
            console.log('Login successful')
            // Automatically enter room after successful login
            if (this.macNo) {
              this.enterRoom(this.macNo)
            }
          } else {
            console.error('Login failed')
          }
        } else if (object.packageType === 'STARTGAMEMESSAGE' && object.startGameMessage) {
          // Handle start game response from server
          console.log('Start game response:', object.startGameMessage)
          this.onStartGameResult?.(object.startGameMessage)
        } else if (object.packageType === 'PLAYGAMEORDER' && object.playGameOrder) {
          // Handle queue position update from server
          console.log('Queue position update:', object.playGameOrder)
          this.onQueueUpdate?.(object.playGameOrder)
        } else if (object.packageType === 'SENDMESSAGETOROOMMATE' && object.sendMessageToRoomMate) {
          // Handle inter-player messages
          console.log('Room message:', object.sendMessageToRoomMate)
          this.onRoomMessage?.(object.sendMessageToRoomMate)
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

  public joinQueue(macNo: string) {
    if (!macNo) {
      console.error('No machine specified for queue')
      return
    }

    console.log('Joining queue for machine:', macNo)
    this.sendMessage(PackageType.PLAYGAMEORDER, 'playGameOrder', {
      userID: this.userId,
      macNo: macNo,
      order: 0, // Order will be assigned by server
    })
  }

  public leaveQueue(macNo: string) {
    if (!macNo) {
      console.error('No machine specified for leaving queue')
      return
    }

    console.log('Leaving queue for machine:', macNo)
    // Send a negative order or specific value to indicate leaving queue
    // The server should interpret this as a leave queue request
    this.sendMessage(PackageType.PLAYGAMEORDER, 'playGameOrder', {
      userID: this.userId,
      macNo: macNo,
      order: -1, // -1 indicates leaving queue
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

export { ProtobufSocketClient }
export default ProtobufSocketClient
