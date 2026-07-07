import type { GameState } from './chessEngine'

/** 代数记谱法 -> [row, col]，如 e4 -> [4, 4] */
export function squareToCoord(square: string): [number, number] {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(square[1], 10)
  const row = 8 - rank
  return [row, col]
}

/** [row, col] -> 代数记谱法 */
export function coordToSquare(row: number, col: number): string {
  return `${String.fromCharCode('a'.charCodeAt(0) + col)}${8 - row}`
}

export function boardToFen(state: GameState): string {
  const { board, white_turn } = state
  const ranks: string[] = []

  for (let r = 0; r < 8; r++) {
    let rank = ''
    let empty = 0
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p === '.') {
        empty++
      } else {
        if (empty > 0) {
          rank += empty
          empty = 0
        }
        rank += p
      }
    }
    if (empty > 0) rank += empty
    ranks.push(rank)
  }

  let castling = ''
  if (!state.white_king_moved && !state.white_h_rook_moved) castling += 'K'
  if (!state.white_king_moved && !state.white_a_rook_moved) castling += 'Q'
  if (!state.black_king_moved && !state.black_h_rook_moved) castling += 'k'
  if (!state.black_king_moved && !state.black_a_rook_moved) castling += 'q'

  let ep = '-'
  if (state.ep_target) {
    const [er, ec] = state.ep_target
    ep = coordToSquare(er, ec)
  }

  return `${ranks.join('/')} ${white_turn ? 'w' : 'b'} ${castling || '-'} ${ep} 0 1`
}

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState
}
