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

export interface GameOverEvent {
  roomCode: string
  reason: 'timeout'
  winner: PlayerColor
  loser: PlayerColor
  whiteTime: number
  blackTime: number
}

export interface ClockSyncEvent {
  roomCode: string
  whiteTime: number
  blackTime: number
  paused: boolean
  timePerSideMinutes?: number
}

export interface PauseRequestEvent {
  roomCode: string
  from: PlayerColor
}

export interface PauseAcceptedEvent extends ClockSyncEvent {
  from: PlayerColor
  by: PlayerColor
}

export interface PauseDeclinedEvent {
  roomCode: string
  from: PlayerColor
  by: PlayerColor
}

export interface ResumeRequestEvent {
  roomCode: string
  from: PlayerColor
}

export interface ResumeAcceptedEvent extends ClockSyncEvent {
  from: PlayerColor
  by: PlayerColor
}

export interface ResumeDeclinedEvent {
  roomCode: string
  from: PlayerColor
  by: PlayerColor
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
  whiteTime?: number
  blackTime?: number
  paused?: boolean
  timePerSideMinutes?: number
}

export interface GameResult {
  reason: 'resign' | 'timeout'
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
  timePerSideMinutes?: number
  whiteTime?: number
  blackTime?: number
  paused?: boolean
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
