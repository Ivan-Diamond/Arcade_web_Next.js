import protobuf from 'protobufjs'
import path from 'path'

// Load proto file
const protoPath = path.join(process.cwd(), 'lib/proto/CustomerNettyProto.proto')

let root: protobuf.Root | null = null

export async function loadProto() {
  if (!root) {
    root = await protobuf.load(protoPath)
  }
  return root
}

export function getMessageTypes() {
  if (!root) {
    throw new Error('Proto not loaded. Call loadProto() first.')
  }
  
  return {
    DataPackage: root.lookupType('DataPackage'),
    LoginMessage: root.lookupType('LoginMessage'),
    SendMessageToRoomMate: root.lookupType('SendMessageToRoomMate'),
    StartGameMessage: root.lookupType('StartGameMessage'),
    ArmMoveMessage: root.lookupType('ArmMoveMessage'),
    HeartMessage: root.lookupType('HeartMessage'),
    GameResultMessage: root.lookupType('GameResultMessage'),
    BallCountMessage: root.lookupType('BallCountMessage'),
    ScoreMessage: root.lookupType('ScoreMessage'),
    EnterRoomMessage: root.lookupType('EnterRoomMessage'),
    ExitRoomMessage: root.lookupType('ExitRoomMessage'),
    NumberOfPeopleInTheRoomMessage: root.lookupType('NumberOfPeopleInTheRoomMessage'),
    WawaMoveMessage: root.lookupType('WawaMoveMessage'),
    WawaResultMessage: root.lookupType('WawaResultMessage'),
  }
}

export function getPackageType() {
  if (!root) {
    throw new Error('Proto not loaded. Call loadProto() first.')
  }
  
  const PackageType = root.lookupEnum('PackageType')
  return PackageType.values
}
