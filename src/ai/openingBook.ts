import { initGame, type GameState, type TeleportConfig } from '../chessEngine'
import { DEFAULT_CONFIG } from '../multiplayer/gameHelpers'
import { applyAiMove } from './applyMove'
import type { AiMove } from './types'

type BookChoice = { move: AiMove; weight: number }

const MOVE = {
  e4: { kind: 'normal', fr: 6, fc: 4, tr: 4, tc: 4 } as AiMove,
  d4: { kind: 'normal', fr: 6, fc: 3, tr: 4, tc: 3 } as AiMove,
  c4: { kind: 'normal', fr: 6, fc: 2, tr: 4, tc: 2 } as AiMove,
  Nf3: { kind: 'normal', fr: 7, fc: 6, tr: 5, tc: 5 } as AiMove,
  Bc4: { kind: 'normal', fr: 7, fc: 5, tr: 4, tc: 2 } as AiMove,
  Bb5: { kind: 'normal', fr: 7, fc: 5, tr: 3, tc: 1 } as AiMove,

  e5: { kind: 'normal', fr: 1, fc: 4, tr: 3, tc: 4 } as AiMove,
  c5: { kind: 'normal', fr: 1, fc: 2, tr: 3, tc: 2 } as AiMove,
  e6: { kind: 'normal', fr: 1, fc: 4, tr: 2, tc: 4 } as AiMove,
  d5: { kind: 'normal', fr: 1, fc: 3, tr: 3, tc: 3 } as AiMove,
  Nf6: { kind: 'normal', fr: 0, fc: 6, tr: 2, tc: 5 } as AiMove,
  Nc6: { kind: 'normal', fr: 0, fc: 1, tr: 2, tc: 2 } as AiMove,
  d6: { kind: 'normal', fr: 1, fc: 3, tr: 2, tc: 3 } as AiMove,
  g6: { kind: 'normal', fr: 1, fc: 6, tr: 2, tc: 6 } as AiMove,
  c6: { kind: 'normal', fr: 1, fc: 2, tr: 2, tc: 2 } as AiMove,
}

export function positionKey(state: GameState): string {
  return `${state.board.map((r) => r.join('')).join('/')}|${state.white_turn ? 'w' : 'b'}`
}

function buildBook(config: TeleportConfig): Map<string, BookChoice[]> {
  const book = new Map<string, BookChoice[]>()

  const add = (line: AiMove[], choices: BookChoice[]) => {
    let s = initGame(config)
    for (const m of line) s = applyAiMove(s, config, m)
    book.set(positionKey(s), choices)
  }

  const w = (move: AiMove, weight = 1): BookChoice => ({ move, weight })

  add([], [w(MOVE.e4, 4), w(MOVE.d4, 4), w(MOVE.Nf3, 2), w(MOVE.c4, 2)])

  add([MOVE.e4], [w(MOVE.e5, 4), w(MOVE.c5, 3), w(MOVE.e6, 2), w(MOVE.Nf6, 2)])
  add([MOVE.d4], [w(MOVE.d5, 3), w(MOVE.Nf6, 3), w(MOVE.e6, 2), w(MOVE.c5, 2)])
  add([MOVE.c4], [w(MOVE.e5, 3), w(MOVE.c5, 3), w(MOVE.e6, 2), w(MOVE.Nf6, 2)])

  add([MOVE.e4, MOVE.e5], [w(MOVE.Nf3, 4), w(MOVE.Bc4, 3), w(MOVE.d4, 2)])
  add([MOVE.e4, MOVE.e5, MOVE.Nf3], [w(MOVE.Nc6, 4), w(MOVE.Nf6, 3), w(MOVE.d6, 2)])
  add([MOVE.e4, MOVE.e5, MOVE.Nf3, MOVE.Nc6], [w(MOVE.Bb5, 3), w(MOVE.Bc4, 3), w(MOVE.d4, 2)])

  add([MOVE.e4, MOVE.c5], [w(MOVE.Nf3, 4), w(MOVE.d4, 3), w(MOVE.c4, 2)])
  add([MOVE.e4, MOVE.c5, MOVE.Nf3], [w(MOVE.d6, 3), w(MOVE.Nc6, 3), w(MOVE.e6, 2), w(MOVE.g6, 1)])

  add([MOVE.d4, MOVE.d5], [w(MOVE.c4, 4), w(MOVE.Nf3, 3), w(MOVE.e4, 1)])
  add([MOVE.d4, MOVE.d5, MOVE.c4], [w(MOVE.e6, 3), w(MOVE.c6, 2), w(MOVE.Nf6, 2)])

  add([MOVE.d4, MOVE.Nf6], [w(MOVE.c4, 3), w(MOVE.Nf3, 3), w(MOVE.g6, 1)])
  add([MOVE.d4, MOVE.Nf6, MOVE.c4], [w(MOVE.g6, 3), w(MOVE.e6, 2), w(MOVE.c6, 2)])

  add([MOVE.e4, MOVE.c6], [w(MOVE.d4, 4), w(MOVE.Nf3, 2), w(MOVE.c4, 2)])
  add([MOVE.e4, MOVE.e6], [w(MOVE.d4, 4), w(MOVE.Nf3, 2), w(MOVE.c4, 2)])

  return book
}

const BOOK = buildBook(DEFAULT_CONFIG)

function sameMove(a: AiMove, b: AiMove): boolean {
  return (
    a.kind === b.kind &&
    a.fr === b.fr &&
    a.fc === b.fc &&
    a.tr === b.tr &&
    a.tc === b.tc &&
    (a.promo ?? '') === (b.promo ?? '')
  )
}

export function pickOpeningMove(
  state: GameState,
  legalMoves: AiMove[],
  random: () => number = Math.random,
): AiMove | null {
  const choices = BOOK.get(positionKey(state))
  if (!choices || choices.length === 0) return null

  const valid = choices
    .map((c) => {
      const match = legalMoves.find((m) => sameMove(m, c.move))
      return match ? { move: match, weight: c.weight } : null
    })
    .filter((x): x is BookChoice => x !== null)

  if (valid.length === 0) return null

  const total = valid.reduce((s, c) => s + c.weight, 0)
  let roll = random() * total
  for (const c of valid) {
    roll -= c.weight
    if (roll <= 0) return c.move
  }
  return valid[valid.length - 1].move
}
