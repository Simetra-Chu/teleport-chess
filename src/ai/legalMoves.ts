import {
  type GameState,
  type TeleportConfig,
  checkTeleportValid,
  isBlack,
  isWhite,
} from '../chessEngine'
import { checkNormalMoveValid, getPseudoLegalTargets } from '../normalMoves'
import { needsPromotionChoice } from '../gameStatus'
import type { AiMove } from './types'

/** 列出当前方所有合法走法（常规 + 瞬移） */
export function getAllLegalMoves(state: GameState, config: TeleportConfig): AiMove[] {
  const moves: AiMove[] = []

  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

      for (const [tr, tc] of getPseudoLegalTargets(state, fr, fc)) {
        const result = checkNormalMoveValid(state, config, fr, fc, tr, tc)
        if (!result.valid) continue

        if (needsPromotionChoice(state, config, fr, fc, tr, tc)) {
          for (const promo of ['Q', 'R', 'B', 'N'] as const) {
            moves.push({ kind: 'normal', fr, fc, tr, tc, promo })
          }
        } else {
          moves.push({ kind: 'normal', fr, fc, tr, tc })
        }
      }
    }
  }

  const tpLeft = state.white_turn ? state.white_tp_left : state.black_tp_left
  if (tpLeft > 0) {
    for (let fr = 0; fr < 8; fr++) {
      for (let fc = 0; fc < 8; fc++) {
        const piece = state.board[fr][fc]
        if (piece === '.') continue
        if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (fr === tr && fc === tc) continue
            const result = checkTeleportValid(state, config, fr, fc, tr, tc)
            if (result.valid) {
              moves.push({ kind: 'teleport', fr, fc, tr, tc })
            }
          }
        }
      }
    }
  }

  return moves
}
