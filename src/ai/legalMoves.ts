import {
  type GameState,
  type TeleportConfig,
  checkTeleportValid,
  findKing,
  isBlack,
  isWhite,
} from '../chessEngine'
import { checkNormalMoveValid, getPseudoLegalTargets } from '../normalMoves'
import { needsPromotionChoice } from '../gameStatus'
import type { AiMove } from './types'

export type MoveGenOptions = {
  /** 搜索内部节点：少算瞬移、升变只算后 */
  forSearch?: boolean
  /** 最多返回多少步（0 = 不限制） */
  maxMoves?: number
}

function manhattan(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2)
}

function collectEmptySquares(board: GameState['board']): Array<[number, number]> {
  const empties: Array<[number, number]> = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === '.') empties.push([r, c])
    }
  }
  return empties
}

function appendTeleports(
  state: GameState,
  config: TeleportConfig,
  moves: AiMove[],
  forSearch: boolean,
  maxTeleports: number,
): void {
  const tpLeft = state.white_turn ? state.white_tp_left : state.black_tp_left
  if (tpLeft <= 0 || maxTeleports <= 0) return

  const [ekr, ekc] = findKing(state.board, !state.white_turn)
  const empties = collectEmptySquares(state.board)
  if (empties.length === 0) return

  type Scored = { move: AiMove; score: number }
  const candidates: Scored[] = []

  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue
      if (!config.tp_any_piece && piece.toUpperCase() !== 'Q') continue

      const pieceBonus = piece.toUpperCase() === 'Q' ? 4 : piece.toUpperCase() === 'N' ? 2 : 0
      const ranked = empties
        .map(([tr, tc]) => ({
          tr,
          tc,
          dist: ekr === -1 ? 0 : manhattan(tr, tc, ekr, ekc),
        }))
        .sort((a, b) => a.dist - b.dist)

      const perPiece = forSearch ? 2 : 4
      for (const { tr, tc, dist } of ranked.slice(0, perPiece)) {
        const result = checkTeleportValid(state, config, fr, fc, tr, tc)
        if (!result.valid) continue
        candidates.push({
          move: { kind: 'teleport', fr, fc, tr, tc },
          score: 100 - dist + pieceBonus,
        })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  for (const { move } of candidates.slice(0, maxTeleports)) {
    moves.push(move)
  }
}

function appendNormalMoves(
  state: GameState,
  config: TeleportConfig,
  moves: AiMove[],
): void {
  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

      for (const [tr, tc] of getPseudoLegalTargets(state, fr, fc)) {
        const result = checkNormalMoveValid(state, config, fr, fc, tr, tc)
        if (!result.valid) continue

        if (needsPromotionChoice(state, config, fr, fc, tr, tc)) {
          moves.push({ kind: 'normal', fr, fc, tr, tc, promo: 'Q' })
        } else {
          moves.push({ kind: 'normal', fr, fc, tr, tc })
        }
      }
    }
  }
}

/** 列出当前方合法走法（常规 + 有限瞬移） */
export function getAllLegalMoves(
  state: GameState,
  config: TeleportConfig,
  options: MoveGenOptions = {},
): AiMove[] {
  const forSearch = options.forSearch ?? false
  const maxMoves = options.maxMoves ?? 0
  const moves: AiMove[] = []

  appendNormalMoves(state, config, moves)
  appendTeleports(state, config, moves, forSearch, forSearch ? 4 : 12)

  if (maxMoves > 0 && moves.length > maxMoves) {
    return moves.slice(0, maxMoves)
  }
  return moves
}

/** 是否存在合法走法（找到一步即返回，供搜索剪枝） */
export function hasAnyLegalMove(
  state: GameState,
  config: TeleportConfig,
  forSearch = true,
): boolean {
  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

      for (const [tr, tc] of getPseudoLegalTargets(state, fr, fc)) {
        if (checkNormalMoveValid(state, config, fr, fc, tr, tc).valid) return true
      }
    }
  }

  const tpLeft = state.white_turn ? state.white_tp_left : state.black_tp_left
  if (tpLeft <= 0) return false

  const empties = collectEmptySquares(state.board)
  let teleportsChecked = 0
  const maxChecks = forSearch ? 8 : 24

  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue
      if (!config.tp_any_piece && piece.toUpperCase() !== 'Q') continue

      for (const [tr, tc] of empties) {
        if (teleportsChecked >= maxChecks) return false
        teleportsChecked++
        if (checkTeleportValid(state, config, fr, fc, tr, tc).valid) return true
      }
    }
  }

  return false
}
