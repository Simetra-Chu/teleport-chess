import {
  type GameState,
  type TeleportConfig,
  executeNormalMove,
  inCheck,
  isBlack,
  isEnemyKing,
  isWhite,
} from './chessEngine'
import { cloneState } from './boardUtils'

const INSIDE = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8

function isOwnPiece(state: GameState, r: number, c: number): boolean {
  const p = state.board[r][c]
  if (p === '.') return false
  return state.white_turn ? isWhite(p) : isBlack(p)
}

function isEnemyPiece(state: GameState, r: number, c: number): boolean {
  const p = state.board[r][c]
  if (p === '.') return false
  return state.white_turn ? isBlack(p) : isWhite(p)
}

function canCastle(
  state: GameState,
  kingRow: number,
  kingCol: number,
  rookCol: number,
  side: 'K' | 'Q',
): boolean {
  const step = side === 'K' ? 1 : -1
  const endCol = kingCol + step * 2
  if (!INSIDE(kingRow, endCol) || !INSIDE(kingRow, rookCol)) return false
  if (state.board[kingRow][rookCol].toUpperCase() !== 'R') return false

  for (let c = Math.min(kingCol, rookCol) + 1; c < Math.max(kingCol, rookCol); c++) {
    if (c === kingCol) continue
    if (state.board[kingRow][c] !== '.') return false
  }

  for (let c = kingCol; c !== endCol + step; c += step) {
    if (inCheck(state.board, state.white_turn) && c === kingCol) continue
    // king passes through / lands on safe squares
  }

  const passCol = kingCol + step
  const landCol = kingCol + step * 2
  if (inCheck(state.board, state.white_turn)) return false
  const boardPass = cloneState(state).board
  boardPass[kingRow][kingCol] = '.'
  boardPass[kingRow][passCol] = state.board[kingRow][kingCol]
  if (inCheck(boardPass, state.white_turn)) return false
  const boardLand = cloneState(state).board
  boardLand[kingRow][kingCol] = '.'
  boardLand[kingRow][landCol] = state.board[kingRow][kingCol]
  return !inCheck(boardLand, state.white_turn)
}

function addCastlingMoves(state: GameState, moves: [number, number][]) {
  if (state.white_turn) {
    if (!state.white_king_moved && !state.white_h_rook_moved && canCastle(state, 7, 4, 7, 'K')) {
      moves.push([7, 6])
    }
    if (!state.white_king_moved && !state.white_a_rook_moved && canCastle(state, 7, 4, 0, 'Q')) {
      moves.push([7, 2])
    }
  } else {
    if (!state.black_king_moved && !state.black_h_rook_moved && canCastle(state, 0, 4, 7, 'K')) {
      moves.push([0, 6])
    }
    if (!state.black_king_moved && !state.black_a_rook_moved && canCastle(state, 0, 4, 0, 'Q')) {
      moves.push([0, 2])
    }
  }
}

function rayMoves(
  state: GameState,
  fr: number,
  fc: number,
  dirs: number[][],
  moves: [number, number][],
) {
  for (const [dr, dc] of dirs) {
    let r = fr + dr
    let c = fc + dc
    while (INSIDE(r, c)) {
      const target = state.board[r][c]
      if (target === '.') {
        moves.push([r, c])
      } else {
        if (isEnemyPiece(state, r, c) && !isEnemyKing(state.board, r, c, state.white_turn)) {
          moves.push([r, c])
        }
        break
      }
      r += dr
      c += dc
    }
  }
}

export function getPseudoLegalTargets(state: GameState, fr: number, fc: number): [number, number][] {
  const piece = state.board[fr][fc]
  if (piece === '.' || !isOwnPiece(state, fr, fc)) return []

  const pt = piece.toUpperCase()
  const moves: [number, number][] = []
  const forward = state.white_turn ? -1 : 1
  const startRow = state.white_turn ? 6 : 1

  if (pt === 'P') {
    const oneR = fr + forward
    if (INSIDE(oneR, fc) && state.board[oneR][fc] === '.') {
      moves.push([oneR, fc])
      const twoR = fr + forward * 2
      if (fr === startRow && state.board[twoR][fc] === '.') {
        moves.push([twoR, fc])
      }
    }
    for (const dc of [-1, 1]) {
      const nr = fr + forward
      const nc = fc + dc
      if (!INSIDE(nr, nc)) continue
      if (isEnemyPiece(state, nr, nc) && !isEnemyKing(state.board, nr, nc, state.white_turn)) {
        moves.push([nr, nc])
      }
      if (
        state.ep_target &&
        nr === state.ep_target[0] &&
        nc === state.ep_target[1]
      ) {
        moves.push([nr, nc])
      }
    }
  }

  if (pt === 'N') {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      const nr = fr + dr
      const nc = fc + dc
      if (!INSIDE(nr, nc)) continue
      if (
        state.board[nr][nc] === '.' ||
        (isEnemyPiece(state, nr, nc) && !isEnemyKing(state.board, nr, nc, state.white_turn))
      ) {
        moves.push([nr, nc])
      }
    }
  }

  if (pt === 'B') rayMoves(state, fr, fc, [[1, 1], [1, -1], [-1, 1], [-1, -1]], moves)
  if (pt === 'R') rayMoves(state, fr, fc, [[1, 0], [-1, 0], [0, 1], [0, -1]], moves)
  if (pt === 'Q') {
    rayMoves(state, fr, fc, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], moves)
  }

  if (pt === 'K') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = fr + dr
      const nc = fc + dc
      if (!INSIDE(nr, nc)) continue
      if (
        state.board[nr][nc] === '.' ||
        (isEnemyPiece(state, nr, nc) && !isEnemyKing(state.board, nr, nc, state.white_turn))
      ) {
        moves.push([nr, nc])
      }
    }
    addCastlingMoves(state, moves)
  }

  return moves
}

export function applyCastlingIfNeeded(
  state: GameState,
  config: TeleportConfig,
  fr: number,
  fc: number,
  tr: number,
  tc: number,
): GameState {
  const piece = state.board[fr][fc]
  if (piece.toUpperCase() !== 'K' || Math.abs(tc - fc) !== 2) {
    return executeNormalMove(state, config, fr, fc, tr, tc)
  }

  const next = cloneState(state)
  const row = fr
  next.board[row][fc] = '.'
  next.board[row][tc] = piece

  if (tc === 6) {
    next.board[row][5] = next.board[row][7]
    next.board[row][7] = '.'
    if (next.white_turn) next.white_h_rook_moved = true
    else next.black_h_rook_moved = true
  } else if (tc === 2) {
    next.board[row][3] = next.board[row][0]
    next.board[row][0] = '.'
    if (next.white_turn) next.white_a_rook_moved = true
    else next.black_a_rook_moved = true
  }

  if (next.white_turn) next.white_king_moved = true
  else next.black_king_moved = true
  next.ep_target = null
  next.white_turn = !next.white_turn
  return next
}

export function checkNormalMoveValid(
  state: GameState,
  config: TeleportConfig,
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  promoPiece: string | null = 'Q',
): { valid: boolean; msg: string } {
  if (fr === tr && fc === tc) return { valid: false, msg: '未移动' }

  if (isEnemyKing(state.board, tr, tc, state.white_turn)) {
    return { valid: false, msg: '不能吃对方的王' }
  }

  const targets = getPseudoLegalTargets(state, fr, fc)
  const ok = targets.some(([r, c]) => r === tr && c === tc)
  if (!ok) return { valid: false, msg: '不符合常规走法' }

  const piece = state.board[fr][fc]
  const pt = piece.toUpperCase()
  const isCastle = pt === 'K' && Math.abs(tc - fc) === 2

  const next = isCastle
    ? applyCastlingIfNeeded(state, config, fr, fc, tr, tc)
    : executeNormalMove(state, config, fr, fc, tr, tc, promoPiece)

  if (inCheck(next.board, state.white_turn)) {
    return { valid: false, msg: '走后己方仍被将军' }
  }

  return { valid: true, msg: '合法走棋' }
}

export function applyNormalMove(
  state: GameState,
  config: TeleportConfig,
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  promoPiece: string | null = 'Q',
): GameState {
  const piece = state.board[fr][fc]
  if (piece.toUpperCase() === 'K' && Math.abs(tc - fc) === 2) {
    return applyCastlingIfNeeded(state, config, fr, fc, tr, tc)
  }
  return executeNormalMove(state, config, fr, fc, tr, tc, promoPiece)
}
