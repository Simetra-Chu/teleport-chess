import type { PromoPiece } from '../gameStatus'

export type AiDifficulty = 'easy' | 'medium' | 'hard'

export interface AiMove {
  kind: 'normal' | 'teleport'
  fr: number
  fc: number
  tr: number
  tc: number
  promo?: PromoPiece
}

export const AI_DIFFICULTY_LABELS: Record<AiDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
