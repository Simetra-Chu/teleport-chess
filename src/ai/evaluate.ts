import {
  type GameState,
  type TeleportConfig,
  findKing,
  inCheck,
  isWhite,
} from '../chessEngine'
import { hasAnyLegalMove } from './legalMoves'
import { endgamePhase, isOpeningPhase, pieceSquareBonus } from './pieceSquare'

const PIECE_VALUES: Record<string, number> = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000,
}

function pieceValue(piece: string): number {
  return PIECE_VALUES[piece.toUpperCase()] ?? 0
}

function manhattan(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2)
}

/** 双象奖励、叠兵轻罚等简易中局知识 */
function structureBonus(state: GameState): number {
  let score = 0
  let whiteBishops = 0
  let blackBishops = 0
  const whitePawnFiles = new Set<number>()
  const blackPawnFiles = new Set<number>()
  const whitePawnCount = Array(8).fill(0)
  const blackPawnCount = Array(8).fill(0)

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p === 'B') whiteBishops++
      if (p === 'b') blackBishops++
      if (p === 'P') {
        whitePawnFiles.add(c)
        whitePawnCount[c]++
      }
      if (p === 'p') {
        blackPawnFiles.add(c)
        blackPawnCount[c]++
      }
    }
  }

  if (whiteBishops >= 2) score += 25
  if (blackBishops >= 2) score -= 25

  for (let c = 0; c < 8; c++) {
    if (whitePawnCount[c] > 1) score -= 8
    if (blackPawnCount[c] > 1) score += 8
  }

  return score
}

/** 瞬移资源：保留次数、落点接近对方王/中心 */
function teleportKnowledge(state: GameState, config: TeleportConfig, phase: number): number {
  let score = 0
  score += state.white_tp_left * 18 - state.black_tp_left * 18

  if (isOpeningPhase(state) && phase < 0.85) {
    // 开局先出子，瞬移留到战术时机
    score += state.white_tp_left * 6 - state.black_tp_left * 6
  }

  const [wkr, wkc] = findKing(state.board, true)
  const [bkr, bkc] = findKing(state.board, false)

  // 对方少一次瞬移 = 防守资源更少
  if (config.tp_cannot_check === false) {
    score += (1 - state.white_tp_left) * 4 - (1 - state.black_tp_left) * 4
  }

  void wkr
  void wkc
  void bkr
  void bkc
  return score
}

/** 从白方视角评估局面（正分对白有利） */
export function evaluateBoard(state: GameState, config: TeleportConfig): number {
  const [wkr, wkc] = findKing(state.board, true)
  const [bkr, bkc] = findKing(state.board, false)
  if (wkr === -1) return -99999
  if (bkr === -1) return 99999

  const phase = endgamePhase(state)
  let score = 0
  let whiteDeveloped = 0
  let blackDeveloped = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c]
      if (p === '.') continue

      const val = pieceValue(p)
      score += isWhite(p) ? val : -val
      score += pieceSquareBonus(p, r, c, phase)

      const pt = p.toUpperCase()
      if (pt === 'K') continue

      if (isWhite(p)) {
        if (r < 6) whiteDeveloped++
        score += Math.max(0, 14 - manhattan(r, c, bkr, bkc)) * (0.35 + (1 - phase) * 0.35)
      } else {
        if (r > 1) blackDeveloped++
        score -= Math.max(0, 14 - manhattan(r, c, wkr, wkc)) * (0.35 + (1 - phase) * 0.35)
      }
    }
  }

  if (inCheck(state.board, true)) score -= 55
  if (inCheck(state.board, false)) score += 55

  score += structureBonus(state)
  score += teleportKnowledge(state, config, phase)

  // 出子领先（中局进攻防守基础）
  if (isOpeningPhase(state)) {
    score += (whiteDeveloped - blackDeveloped) * 4
  }

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

/** 对单步走法的静态评估增量（用于走法排序） */
export function evaluateMoveStatic(
  state: GameState,
  config: TeleportConfig,
  move: { kind: string; fr: number; fc: number; tr: number; tc: number },
): number {
  let score = 0
  const target = state.board[move.tr][move.tc]
  const piece = state.board[move.fr][move.fc]

  if (target !== '.') {
    score += pieceValue(target) * 10 - pieceValue(piece)
  }

  if (move.kind === 'teleport') {
    score += isOpeningPhase(state) ? -25 : 12
    const [ekr, ekc] = findKing(state.board, !state.white_turn)
    if (ekr !== -1) score += Math.max(0, 10 - manhattan(move.tr, move.tc, ekr, ekc))
    if (config.tp_cannot_capture) score += 2
  }

  score += pieceSquareBonus(piece, move.tr, move.tc, endgamePhase(state)) * 0.3

  return score
}
