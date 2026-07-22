/** 棋子位置表（PeSTO 简化版，白方视角；黑方用 mirrorRow） */

function mirrorRow(r: number): number {
  return 7 - r
}

function pstFor(r: number, c: number, table: number[][]): number {
  return table[r][c]
}

// 兵：鼓励推进与占中心
const PAWN_MG: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 5, 5, -5, -5, 5, 5, 5],
  [2, 2, 3, 4, 4, 3, 2, 2],
  [1, 1, 2, 5, 5, 2, 1, 1],
  [0, 0, 0, 3, 3, 0, 0, 0],
  [1, 1, 1, -2, -2, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

const KNIGHT_MG: number[][] = [
  [-5, -4, -3, -3, -3, -3, -4, -5],
  [-4, -2, 0, 1, 1, 0, -2, -4],
  [-3, 0, 2, 3, 3, 2, 0, -3],
  [-3, 1, 3, 4, 4, 3, 1, -3],
  [-3, 0, 3, 4, 4, 3, 0, -3],
  [-3, 1, 2, 3, 3, 2, 1, -3],
  [-4, -2, 0, 0, 0, 0, -2, -4],
  [-5, -4, -3, -3, -3, -3, -4, -5],
]

const BISHOP_MG: number[][] = [
  [-3, -2, -1, -1, -1, -1, -2, -3],
  [-2, 0, 0, 1, 1, 0, 0, -2],
  [-1, 0, 2, 3, 3, 2, 0, -1],
  [-1, 1, 2, 3, 3, 2, 1, -1],
  [-1, 0, 3, 3, 3, 3, 0, -1],
  [-1, 1, 2, 3, 3, 2, 1, -1],
  [-2, 0, 1, 1, 1, 1, 0, -2],
  [-3, -2, -1, -1, -1, -1, -2, -3],
]

const ROOK_MG: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 2, 3, 3, 2, 2, 1],
  [-1, 0, 0, 0, 0, 0, 0, -1],
  [-1, 0, 0, 0, 0, 0, 0, -1],
  [-1, 0, 0, 0, 0, 0, 0, -1],
  [-1, 0, 0, 0, 0, 0, 0, -1],
  [3, 4, 4, 4, 4, 4, 4, 3],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

const QUEEN_MG: number[][] = [
  [-4, -3, -2, -1, -1, -2, -3, -4],
  [-3, -2, -1, 0, 0, -1, -2, -3],
  [-2, -1, 0, 1, 1, 0, -1, -2],
  [-1, 0, 1, 2, 2, 1, 0, -1],
  [0, 0, 1, 2, 2, 1, 0, 0],
  [-1, 0, 1, 1, 1, 1, 0, -1],
  [-3, -1, 0, 0, 0, 0, -1, -3],
  [-4, -3, -2, -1, -1, -2, -3, -4],
]

const KING_MG: number[][] = [
  [4, 4, 0, 0, 0, 0, 4, 4],
  [4, 4, 0, 0, 0, 0, 4, 4],
  [-4, -4, -4, -4, -4, -4, -4, -4],
  [-4, -4, -4, -4, -4, -4, -4, -4],
  [-3, -3, -3, -3, -3, -3, -3, -3],
  [-2, -2, -2, -2, -2, -2, -2, -2],
  [-2, -2, -2, -2, -2, -2, -2, -2],
  [4, 4, 0, 0, 0, 0, 4, 4],
]

const KING_EG: number[][] = [
  [-4, -4, -4, -4, -4, -4, -4, -4],
  [-4, -4, -4, -4, -4, -4, -4, -4],
  [-3, -3, -3, -3, -3, -3, -3, -3],
  [-3, -3, -3, -3, -3, -3, -3, -3],
  [-2, -2, -2, -2, -2, -2, -2, -2],
  [-1, -1, -1, -1, -1, -1, -1, -1],
  [2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2],
]

const TABLES: Record<string, number[][]> = {
  P: PAWN_MG,
  N: KNIGHT_MG,
  B: BISHOP_MG,
  R: ROOK_MG,
  Q: QUEEN_MG,
}

export function pieceSquareBonus(piece: string, r: number, c: number, endgamePhase: number): number {
  const pt = piece.toUpperCase()
  const white = piece === pt
  const row = white ? r : mirrorRow(r)
  const col = c

  if (pt === 'K') {
    const mg = pstFor(row, col, KING_MG)
    const eg = pstFor(row, col, KING_EG)
    return mg * (1 - endgamePhase) + eg * endgamePhase
  }

  const table = TABLES[pt]
  if (!table) return 0
  const bonus = pstFor(row, col, table)
  return white ? bonus : -bonus
}

/** 0=开局/中局, 1=残局；按剩余子力估算 */
export function endgamePhase(state: { board: string[][] }): number {
  let material = 0
  for (const row of state.board) {
    for (const p of row) {
      if (p === '.' || p.toUpperCase() === 'K') continue
      const v = p.toUpperCase() === 'Q' ? 9 : p.toUpperCase() === 'R' ? 5 : p.toUpperCase() === 'B' || p.toUpperCase() === 'N' ? 3 : 1
      material += v
    }
  }
  const start = 78
  return Math.max(0, Math.min(1, 1 - material / start))
}

/** 是否仍处开局阶段（用于开局库 / 限制过早瞬移） */
export function isOpeningPhase(state: { board: string[][] }): boolean {
  let homePieces = 0
  for (let c = 0; c < 8; c++) {
    const backWhite = state.board[7][c]
    const backBlack = state.board[0][c]
    if (backWhite !== '.' && backWhite.toUpperCase() !== 'P') homePieces++
    if (backBlack !== '.' && backBlack.toLowerCase() !== 'p') homePieces++
  }
  return homePieces >= 24
}
