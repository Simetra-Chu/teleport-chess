import type { GameState, TeleportConfig } from '../chessEngine'
import { isBlack, isWhite } from '../chessEngine'
import { getAllLegalMoves } from './legalMoves'
import { pickOpeningMove } from './openingBook'
import { isOpeningPhase } from './pieceSquare'
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
  const moves = getAllLegalMoves(state, config, { forSearch: false })
  if (moves.length === 0) return null

  if (difficulty === 'easy') {
    if (isOpeningPhase(state) && Math.random() < 0.55) {
      const book = pickOpeningMove(state, moves)
      if (book) return book
    }
    return pickEasy(state, moves)
  }

  // 中等/困难：开局库 + 搜索（参考 js-chess-engine / Betafish 的分层思路）
  if (isOpeningPhase(state)) {
    const book = pickOpeningMove(state, moves)
    if (book) return book
  }

  const depth = difficulty === 'medium' ? 2 : 2
  return searchBestMove(state, config, depth, aiIsWhite)
}

/** 前端模拟思考延迟（毫秒） */
export const AI_THINK_DELAY_MS = 60
