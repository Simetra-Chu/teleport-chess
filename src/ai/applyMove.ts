import { type GameState, type TeleportConfig, executeTeleport } from '../chessEngine'
import { applyNormalMove } from '../normalMoves'
import type { AiMove } from './types'

export function applyAiMove(
  state: GameState,
  config: TeleportConfig,
  move: AiMove,
): GameState {
  if (move.kind === 'teleport') {
    return executeTeleport(state, move.fr, move.fc, move.tr, move.tc)
  }
  return applyNormalMove(state, config, move.fr, move.fc, move.tr, move.tc, move.promo ?? 'Q')
}
