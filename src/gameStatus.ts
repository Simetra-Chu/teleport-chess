import {
  type GameState,
  type TeleportConfig,
  checkTeleportValid,
  findKing,
  inCheck,
  isBlack,
  isWhite,
} from './chessEngine'
import { checkNormalMoveValid, getPseudoLegalTargets } from './normalMoves'

export type GameOutcome =
  | { status: 'ongoing'; inCheck: boolean }
  | { status: 'checkmate'; winner: 'white' | 'black' }
  | { status: 'stalemate' }

export type PromoPiece = 'Q' | 'R' | 'B' | 'N'

export function needsPromotionChoice(
  state: GameState,
  config: TeleportConfig,
  fr: number,
  fc: number,
  tr: number,
  _tc: number,
): boolean {
  const piece = state.board[fr][fc]
  if (piece.toUpperCase() !== 'P') return false

  const promoRow = state.white_turn ? 0 : 7
  if (tr !== promoRow) return false

  const key = `${fr},${fc}`
  if (config.pawn_tp_no_promote && state.pawn_tp_status[key]) return false

  return true
}

export function hasLegalNormalMove(state: GameState, config: TeleportConfig): boolean {
  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

      for (const [tr, tc] of getPseudoLegalTargets(state, fr, fc)) {
        const result = checkNormalMoveValid(state, config, fr, fc, tr, tc)
        if (result.valid) return true
      }
    }
  }
  return false
}

export function hasLegalTeleportMove(state: GameState, config: TeleportConfig): boolean {
  const tpLeft = state.white_turn ? state.white_tp_left : state.black_tp_left
  if (tpLeft <= 0) return false

  for (let fr = 0; fr < 8; fr++) {
    for (let fc = 0; fc < 8; fc++) {
      const piece = state.board[fr][fc]
      if (piece === '.') continue
      if (state.white_turn ? !isWhite(piece) : !isBlack(piece)) continue

      for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
          if (fr === tr && fc === tc) continue
          const result = checkTeleportValid(state, config, fr, fc, tr, tc)
          if (result.valid) return true
        }
      }
    }
  }
  return false
}

export function getGameOutcome(state: GameState, config: TeleportConfig): GameOutcome {
  const [wkr] = findKing(state.board, true)
  const [bkr] = findKing(state.board, false)

  // 王已被错误吃掉时，仍给出明确胜负（防止卡死）
  if (wkr === -1 && bkr === -1) return { status: 'stalemate' }
  if (wkr === -1) return { status: 'checkmate', winner: 'black' }
  if (bkr === -1) return { status: 'checkmate', winner: 'white' }

  const sideToMove = state.white_turn
  const checked = inCheck(state.board, sideToMove)
  const hasMove = hasLegalNormalMove(state, config) || hasLegalTeleportMove(state, config)

  if (hasMove) {
    return { status: 'ongoing', inCheck: checked }
  }

  if (checked) {
    return { status: 'checkmate', winner: sideToMove ? 'black' : 'white' }
  }

  return { status: 'stalemate' }
}

export function outcomeLabel(outcome: GameOutcome): string {
  if (outcome.status === 'ongoing') {
    return outcome.inCheck ? '将军' : '进行中'
  }
  if (outcome.status === 'checkmate') {
    return outcome.winner === 'white' ? '白方将死胜' : '黑方将死胜'
  }
  return '逼和'
}
