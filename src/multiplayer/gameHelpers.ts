import type { GameState, TeleportConfig } from '../chessEngine'
import { squareToCoord } from '../boardUtils'
import type { PlayerColor } from './types'

export function isPieceOfColor(state: GameState, square: string, color: PlayerColor): boolean {
  const [r, c] = squareToCoord(square)
  const piece = state.board[r][c]
  if (piece === '.') return false
  return color === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase()
}

export function isMyTurn(state: GameState, color: PlayerColor | null): boolean {
  if (!color) return true
  return color === 'white' ? state.white_turn : !state.white_turn
}

export function colorLabel(color: PlayerColor): string {
  return color === 'white' ? '白方' : '黑方'
}

export interface InteractionCheck {
  ok: boolean
  msg?: string
}

export function checkCanInteract(
  state: GameState,
  playerColor: PlayerColor | null,
  square?: string,
  online: boolean = false,
): InteractionCheck {
  if (!online || !playerColor) return { ok: true }

  if (!isMyTurn(state, playerColor)) {
    return { ok: false, msg: '不是你的回合' }
  }

  if (square && !isPieceOfColor(state, square, playerColor)) {
    const [r, c] = squareToCoord(square)
    const piece = state.board[r][c]
    if (piece !== '.') {
      return { ok: false, msg: '你不是该方玩家' }
    }
  }

  return { ok: true }
}

export const DEFAULT_CONFIG: TeleportConfig = {
  each_side_tp_times: 1,
  tp_any_piece: true,
  tp_cannot_capture: true,
  tp_cannot_capture_own: true,
  tp_cannot_check: true,
  pawn_tp_no_promote: true,
}

export const BOARD_DARK = '#769656'
export const BOARD_LIGHT = '#eeeed2'
