import {
  type GameState,
  type TeleportConfig,
  findKing,
  inCheck,
  isBlack,
  isWhite,
  squareAttacked,
} from '../chessEngine'
import { getAllLegalMoves } from './legalMoves'
import { applyAiMove } from './applyMove'

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

/** 评估瞬移落点周围 8 格的控制力（己方棋子攻击覆盖） */
function portalExitControl(board: GameState['board'], r: number, c: number, forWhite: boolean): number {
  let score = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue
      if (squareAttacked(board, nr, nc, forWhite)) score += 3
    }
  }
  return score
}

/** 从白方视角评估局面（正分对白有利） */
export function evaluateBoard(state: GameState, config: TeleportConfig): number {
  let score = 0
  const [wkr] = findKing(state.board, true)
  const [bkr] = findKing(state.board, false)

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p === '.') continue
      const val = pieceValue(p)
      score += isWhite(p) ? val : -val
    }
  }

  if (wkr === -1) return -99999
  if (bkr === -1) return 99999

  if (inCheck(state.board, true)) score -= 45
  if (inCheck(state.board, false)) score += 45

  const whiteTp = state.white_tp_left * 12
  const blackTp = state.black_tp_left * 12
  score += whiteTp - blackTp

  const side = state.white_turn
  const moves = getAllLegalMoves(state, config)
  for (const move of moves) {
    if (move.kind !== 'teleport') continue

    const target = state.board[move.tr][move.tc]
    const sign = side ? 1 : -1

    if (target !== '.' && ((side && isBlack(target)) || (!side && isWhite(target)))) {
      score += sign * (pieceValue(target) + 25)
    }

    const next = applyAiMove(state, config, move)
    const enemyIsWhite = !side
    const [ekr, ekc] = findKing(next.board, enemyIsWhite)
    if (ekr !== -1 && inCheck(next.board, enemyIsWhite)) {
      score += sign * 80
    }

    if (ekr !== -1) {
      const dist = manhattan(move.tr, move.tc, ekr, ekc)
      score += sign * Math.max(0, 14 - dist) * 4
    }

    score += sign * portalExitControl(next.board, move.tr, move.tc, side)
  }

  return score
}

export function isTerminalScore(state: GameState, config: TeleportConfig): number | null {
  const [wkr] = findKing(state.board, true)
  const [bkr] = findKing(state.board, false)
  if (wkr === -1) return -99999
  if (bkr === -1) return 99999

  const moves = getAllLegalMoves(state, config)
  if (moves.length > 0) return null

  if (inCheck(state.board, state.white_turn)) {
    return state.white_turn ? -99999 : 99999
  }
  return 0
}
