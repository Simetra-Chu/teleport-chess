import type { GameState, TeleportConfig } from '../chessEngine'
import { isBlack, isWhite } from '../chessEngine'
import { getAllLegalMoves } from './legalMoves'
import { applyAiMove } from './applyMove'
import { evaluateBoard, evaluateMoveStatic, isTerminalScore } from './evaluate'
import { isOpeningPhase } from './pieceSquare'
import type { AiMove } from './types'

const ROOT_MOVE_CAP = 36
const QUIESCENCE_CAP = 12

const CAPTURE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
}

function isCapture(state: GameState, move: AiMove): boolean {
  const target = state.board[move.tr][move.tc]
  if (target === '.') return false
  return state.white_turn ? isBlack(target) : isWhite(target)
}

/** MVV-LVA + 棋理静态分 + 开局少瞬移 */
function orderMoves(state: GameState, config: TeleportConfig, moves: AiMove[]): AiMove[] {
  return [...moves].sort((a, b) => {
    const sa = moveOrderScore(state, config, a)
    const sb = moveOrderScore(state, config, b)
    return sb - sa
  })
}

function moveOrderScore(state: GameState, config: TeleportConfig, move: AiMove): number {
  let score = evaluateMoveStatic(state, config, move)
  if (isCapture(state, move)) {
    const victim = state.board[move.tr][move.tc]
    const attacker = state.board[move.fr][move.fc]
    const mv = CAPTURE_VALUE[victim.toLowerCase()] ?? 50
    const lv = CAPTURE_VALUE[attacker.toLowerCase()] ?? 50
    score += mv * 16 - lv
  }
  if (move.kind === 'teleport' && isOpeningPhase(state)) score -= 40
  return score
}

function quiescence(
  state: GameState,
  config: TeleportConfig,
  alpha: number,
  beta: number,
  maximizingForWhite: boolean,
): number {
  const standPat = evaluateBoard(state, config)
  if (maximizingForWhite) {
    if (standPat >= beta) return beta
    alpha = Math.max(alpha, standPat)
  } else {
    if (standPat <= alpha) return alpha
    beta = Math.min(beta, standPat)
  }

  const captures = orderMoves(
    state,
    config,
    getAllLegalMoves(state, config, { forSearch: true, maxMoves: 48 }).filter((m) =>
      isCapture(state, m),
    ),
  ).slice(0, QUIESCENCE_CAP)

  if (captures.length === 0) return standPat

  if (maximizingForWhite) {
    let maxEval = standPat
    for (const move of captures) {
      const next = applyAiMove(state, config, move)
      maxEval = Math.max(maxEval, quiescence(next, config, alpha, beta, false))
      alpha = Math.max(alpha, maxEval)
      if (beta <= alpha) break
    }
    return maxEval
  }

  let minEval = standPat
  for (const move of captures) {
    const next = applyAiMove(state, config, move)
    minEval = Math.min(minEval, quiescence(next, config, alpha, beta, true))
    beta = Math.min(beta, minEval)
    if (beta <= alpha) break
  }
  return minEval
}

function searchBestMove(
  state: GameState,
  config: TeleportConfig,
  depth: number,
  aiIsWhite: boolean,
): AiMove | null {
  const rootMoves = orderMoves(
    state,
    config,
    getAllLegalMoves(state, config, { forSearch: false }),
  )
  if (rootMoves.length === 0) return null

  const moves = rootMoves.slice(0, ROOT_MOVE_CAP)
  let bestMove = moves[0]
  let bestScore = aiIsWhite ? -Infinity : Infinity

  for (const move of moves) {
    const next = applyAiMove(state, config, move)
    const score = minimax(next, config, depth - 1, -Infinity, Infinity, !aiIsWhite)
    if (aiIsWhite ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

function minimax(
  state: GameState,
  config: TeleportConfig,
  depth: number,
  alpha: number,
  beta: number,
  maximizingForWhite: boolean,
): number {
  const terminal = isTerminalScore(state, config)
  if (terminal !== null) return terminal

  if (depth <= 0) {
    return quiescence(state, config, alpha, beta, maximizingForWhite)
  }

  const moves = orderMoves(
    state,
    config,
    getAllLegalMoves(state, config, { forSearch: true, maxMoves: 28 }),
  )
  if (moves.length === 0) return evaluateBoard(state, config)

  if (maximizingForWhite) {
    let maxEval = -Infinity
    for (const move of moves) {
      const next = applyAiMove(state, config, move)
      maxEval = Math.max(maxEval, minimax(next, config, depth - 1, alpha, beta, false))
      alpha = Math.max(alpha, maxEval)
      if (beta <= alpha) break
    }
    return maxEval
  }

  let minEval = Infinity
  for (const move of moves) {
    const next = applyAiMove(state, config, move)
    minEval = Math.min(minEval, minimax(next, config, depth - 1, alpha, beta, true))
    beta = Math.min(beta, minEval)
    if (beta <= alpha) break
  }
  return minEval
}

export { searchBestMove, minimax }
