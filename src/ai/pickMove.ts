import type { GameState, TeleportConfig } from '../chessEngine'
import { isBlack, isWhite } from '../chessEngine'
import { getAllLegalMoves } from './legalMoves'
import { searchBestMove } from './search'
import type { AiDifficulty, AiMove } from './types'

function isCapture(state: GameState, move: AiMove): boolean {
  const target = state.board[move.tr][move.tc]
  if (target === '.') return false
  const side = state.white_turn
  return side ? isBlack(target) : isWhite(target)
}

function pickEasy(state: GameState, moves: AiMove[]): AiMove {
  const tactical = moves.filter((m) => m.kind === 'teleport' || isCapture(state, m))
  const pool = tactical.length > 0 && Math.random() < 0.72 ? tactical : moves
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickAiMove(
  state: GameState,
  config: TeleportConfig,
  difficulty: AiDifficulty,
  aiIsWhite: boolean,
): AiMove | null {
  const moves = getAllLegalMoves(state, config)
  if (moves.length === 0) return null

  if (difficulty === 'easy') {
    return pickEasy(state, moves)
  }

  const depth = difficulty === 'medium' ? 2 : 3
  return searchBestMove(state, config, depth, aiIsWhite)
}

/** 前端模拟思考延迟（毫秒） */
export const AI_THINK_DELAY_MS = 180
