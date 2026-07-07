import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import {
  type GameState,
  type TeleportConfig,
  checkTeleportValid,
} from '../chessEngine'
import { coordToSquare, squareToCoord } from '../boardUtils'
import { checkNormalMoveValid, getPseudoLegalTargets } from '../normalMoves'

/** 缓存合法目标格高亮，避免每次渲染重复计算 */
export function useLegalHighlights(
  gameState: GameState,
  config: TeleportConfig,
  selectedSquare: string | null,
  teleportMode: boolean,
  enabled: boolean,
): Record<string, CSSProperties> {
  return useMemo(() => {
    if (!enabled || !selectedSquare) return {}

    const styles: Record<string, CSSProperties> = {}
    const [fr, fc] = squareToCoord(selectedSquare)

    if (teleportMode) {
      for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
          const { valid } = checkTeleportValid(gameState, config, fr, fc, tr, tc)
          if (valid) {
            styles[coordToSquare(tr, tc)] = {
              background:
                'radial-gradient(circle, rgba(147, 51, 234, 0.5) 38%, transparent 39%)',
            }
          }
        }
      }
      return styles
    }

    for (const [tr, tc] of getPseudoLegalTargets(gameState, fr, fc)) {
      const sq = coordToSquare(tr, tc)
      const { valid } = checkNormalMoveValid(gameState, config, fr, fc, tr, tc)
      if (valid) {
        styles[sq] = {
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.45) 38%, transparent 39%)',
        }
      }
    }

    return styles
  }, [gameState, config, selectedSquare, teleportMode, enabled])
}
