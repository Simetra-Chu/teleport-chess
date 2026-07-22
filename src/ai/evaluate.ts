import {
  type GameState,
  type TeleportConfig,
  findKing,
  inCheck,
  isWhite,
} from '../chessEngine'
import { hasAnyLegalMove } from './legalMoves'

const PIECE_VALUES: Record<string, number> = {
  P: 10,
  N: 30,
  B: 30,
  R: 50,
  Q: 90,
  K: 9000,
}

function pieceValue(piece: string): number {
  return PIECE_VALUES[piece.toUpperCase()] ?? 0
}

function manhattan(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2)
}

/** 从白方视角评估局面（正分对白有利） */
export function evaluateBoard(state: GameState, _config: TeleportConfig): number {
  const [wkr, wkc] = findKing(state.board, true)
  const [bkr, bkc] = findKing(state.board, false)
  if (wkr === -1) return -99999
  if (bkr === -1) return 99999

  let score = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p === '.') continue
      const val = pieceValue(p)
      score += isWhite(p) ? val : -val

      if (p.toUpperCase() === 'K') continue
      if (isWhite(p)) {
        score += Math.max(0, 12 - manhattan(r, c, bkr, bkc)) * 0.6
      } else {
        score -= Math.max(0, 12 - manhattan(r, c, wkr, wkc)) * 0.6
      }
    }
  }

  if (inCheck(state.board, true)) score -= 45
  if (inCheck(state.board, false)) score += 45

  score += state.white_tp_left * 12 - state.black_tp_left * 12

  return score
}

export function isTerminalScore(state: GameState, config: TeleportConfig): number | null {
  const [wkr] = findKing(state.board, true)
  const [bkr] = findKing(state.board, false)
  if (wkr === -1) return -99999
  if (bkr === -1) return 99999

  if (hasAnyLegalMove(state, config, true)) return null

  if (inCheck(state.board, state.white_turn)) {
    return state.white_turn ? -99999 : 99999
  }
  return 0
}
