import { BACKEND_URL } from '../config/env'

/** @deprecated 使用 BACKEND_URL */
export const SERVER_URL = BACKEND_URL

export type PlayerColor = 'white' | 'black'

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export type OpponentRequestType = 'restart'

export interface UndoRequestEvent {
  roomCode: string
  from: PlayerColor
}

export interface UndoAcceptedEvent {
  roomCode: string
  from: PlayerColor
  gameState: import('../chessEngine').GameState
}

export interface UndoDeclinedEvent {
  roomCode: string
  from: PlayerColor
  by: PlayerColor
}

export interface GameEndEvent {
  roomCode: string
  reason: 'resign'
  winner: PlayerColor
  loser: PlayerColor
}

export interface OpponentRequestEvent {
  roomCode: string
  type: OpponentRequestType
  from: PlayerColor
}

export interface RequestRespondedEvent {
  roomCode: string
  type: 'restart'
  accept: boolean
  by: PlayerColor
  gameState?: import('../chessEngine').GameState
}

export interface GameResult {
  reason: 'resign'
  winner: PlayerColor
}

export interface RoomAckBase {
  ok: boolean
  error?: string
}

export interface CreateRoomAck extends RoomAckBase {
  roomCode?: string
  color?: PlayerColor
  config?: import('../chessEngine').TeleportConfig
  gameState?: import('../chessEngine').GameState
  status?: RoomStatus
}

export interface JoinRoomAck extends CreateRoomAck {}

export interface SyncMovePayload {
  fr: number
  fc: number
  tr: number
  tc: number
  promoPiece?: string | null
}

export interface OpponentSyncEvent {
  roomCode: string
  type: 'move' | 'teleport'
  by: PlayerColor
  move: SyncMovePayload
  gameState: import('../chessEngine').GameState
}
