import type { GameState, TeleportConfig } from '../chessEngine'
import { getAllLegalMoves } from './legalMoves'
import { applyAiMove } from './applyMove'
import { evaluateBoard, isTerminalScore } from './evaluate'
import type { AiMove } from './types'

const ROOT_MOVE_CAP = 32

function moveHeuristic(state: GameState, move: AiMove): number {
  let score = move.kind === 'teleport' ? 8 : 0
  const target = state.board[move.tr][move.tc]
  if (target !== '.') {
    const vals: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90 }
    score += vals[target.toLowerCase()] ?? 5
  }
  return score
}

function orderMoves(state: GameState, moves: AiMove[]): AiMove[] {
  return [...moves].sort((a, b) => moveHeuristic(state, b) - moveHeuristic(state, a))
}

function searchBestMove(
  state: GameState,
  config: TeleportConfig,
  depth: number,
  aiIsWhite: boolean,
): AiMove | null {
  const rootMoves = orderMoves(state, getAllLegalMoves(state, config, { forSearch: false }))
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
  if (depth <= 0) return evaluateBoard(state, config)

  const moves = orderMoves(state, getAllLegalMoves(state, config, { forSearch: true, maxMoves: 24 }))
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
