import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import PromotionDialog from './PromotionDialog'
import {
  type GameState,
  type TeleportConfig,
  checkTeleportValid,
  executeTeleport,
  initGame,
} from '../chessEngine'
import { boardToFen, coordToSquare, squareToCoord } from '../boardUtils'
import {
  getGameOutcome,
  needsPromotionChoice,
  outcomeLabel,
  type PromoPiece,
} from '../gameStatus'
import { applyNormalMove, checkNormalMoveValid } from '../normalMoves'
import {
  BOARD_DARK,
  BOARD_LIGHT,
  checkCanInteract,
  colorLabel,
  isMyTurn,
  isPieceOfColor,
} from '../multiplayer/gameHelpers'
import { emitAck } from '../multiplayer/socket'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'
import { useLegalHighlights } from '../hooks/useLegalHighlights'
import { useBoardTouchGuard } from '../hooks/useBoardTouchGuard'
import RuleConfigPanel from './RuleConfigPanel'
import type { PlayerColor, RoomStatus } from '../multiplayer/types'

type PendingMove = {
  fr: number
  fc: number
  tr: number
  tc: number
  kind: 'normal' | 'teleport'
  fromLabel: string
  toLabel: string
}

interface GameViewProps {
  config: TeleportConfig
  gameState: GameState
  setGameState: (s: GameState) => void
  playerColor: PlayerColor | null
  roomCode: string | null
  roomStatus: RoomStatus | null
  isOnline: boolean
  onLeaveRoom: () => void
  onOpponentSync: (handler: (event: import('../multiplayer/types').OpponentSyncEvent) => void) => () => void
}

export default function GameView({
  config,
  gameState,
  setGameState,
  playerColor,
  roomCode,
  roomStatus,
  isOnline,
  onLeaveRoom,
  onOpponentSync,
}: GameViewProps) {
  const [teleportMode, setTeleportMode] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [message, setMessage] = useState('点击或拖拽己方棋子走棋')
  const [isDragging, setIsDragging] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  const isTouch = useIsTouchDevice()
  useBoardTouchGuard(boardRef, isTouch)

  useEffect(() => {
    document.body.classList.toggle('is-dragging-piece', isDragging)
    return () => document.body.classList.remove('is-dragging-piece')
  }, [isDragging])

  const myTurn = isMyTurn(gameState, playerColor)
  const canPlay = !isOnline || roomStatus === 'playing'
  const fen = useMemo(() => boardToFen(gameState), [gameState])
  const outcome = useMemo(() => getGameOutcome(gameState, config), [gameState, config])
  const gameOver = outcome.status !== 'ongoing'

  useEffect(() => {
    if (!isOnline) return
    return onOpponentSync((event) => {
      setGameState(event.gameState)
      setSelectedSquare(null)
      setPendingMove(null)
      const who = event.by === 'white' ? '白方' : '黑方'
      setMessage(
        event.type === 'teleport'
          ? `对手（${who}）瞬移了`
          : `对手（${who}）走棋了`,
      )
    })
  }, [isOnline, onOpponentSync, setGameState])

  useEffect(() => {
    if (isOnline && roomStatus === 'playing' && playerColor) {
      setMessage(`对局开始！你执${colorLabel(playerColor)}`)
    }
  }, [isOnline, roomStatus, playerColor])

  const applyLocalOutcome = useCallback(
    (next: GameState, moveMsg: string) => {
      setGameState(next)
      setSelectedSquare(null)
      setPendingMove(null)

      const result = getGameOutcome(next, config)
      if (result.status === 'checkmate') {
        setMessage(`将死！${result.winner === 'white' ? '白方' : '黑方'}获胜 — ${moveMsg}`)
      } else if (result.status === 'stalemate') {
        setMessage(`逼和！双方和棋 — ${moveMsg}`)
      } else if (result.inCheck) {
        setMessage(`将军！${moveMsg}`)
      } else {
        setMessage(moveMsg)
      }
    },
    [config, setGameState],
  )

  const syncToServer = useCallback(
    async (
      next: GameState,
      kind: 'normal' | 'teleport',
      fr: number,
      fc: number,
      tr: number,
      tc: number,
      promoPiece: string | null,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isOnline || roomStatus !== 'playing') return { ok: true }

      const eventName = kind === 'teleport' ? 'teleport' : 'move'
      const res = await emitAck<{ ok: boolean; error?: string }>(eventName, {
        gameState: next,
        move: { fr, fc, tr, tc, promoPiece },
      })
      return res
    },
    [isOnline, roomStatus],
  )

  const finishMove = useCallback(
    async (
      next: GameState,
      kind: 'normal' | 'teleport',
      coords: { fr: number; fc: number; tr: number; tc: number; promoPiece?: string | null },
      moveMsg: string,
    ) => {
      const snapshot = gameState
      applyLocalOutcome(next, moveMsg)

      const sync = await syncToServer(
        next,
        kind,
        coords.fr,
        coords.fc,
        coords.tr,
        coords.tc,
        coords.promoPiece ?? null,
      )
      if (!sync.ok) {
        setGameState(snapshot)
        setMessage(sync.error || '同步失败，已撤销本步')
        return false
      }
      return true
    },
    [gameState, syncToServer, applyLocalOutcome, setGameState],
  )

  const guardInteraction = useCallback(
    (square?: string): boolean => {
      if (!canPlay) {
        setMessage('等待好友加入…')
        return false
      }
      if (gameOver || pendingMove) return false

      const check = checkCanInteract(gameState, playerColor, square, isOnline)
      if (!check.ok) {
        setMessage(check.msg!)
        return false
      }
      return true
    },
    [canPlay, gameOver, pendingMove, gameState, playerColor, isOnline],
  )

  const tryCommitMove = useCallback(
    async (
      fr: number,
      fc: number,
      tr: number,
      tc: number,
      kind: 'normal' | 'teleport',
      fromLabel: string,
      toLabel: string,
      promoPiece?: string | null,
    ): Promise<boolean> => {
      if (!guardInteraction(fromLabel)) return false

      if (kind === 'teleport') {
        const result = checkTeleportValid(gameState, config, fr, fc, tr, tc)
        if (!result.valid) {
          setMessage(result.msg)
          return false
        }
        const next = executeTeleport(gameState, fr, fc, tr, tc)
        return finishMove(next, 'teleport', { fr, fc, tr, tc }, `⚡ 瞬移：${fromLabel} → ${toLabel}`)
      }

      const result = checkNormalMoveValid(gameState, config, fr, fc, tr, tc, promoPiece ?? 'Q')
      if (!result.valid) {
        setMessage(result.msg)
        return false
      }

      if (!promoPiece && needsPromotionChoice(gameState, config, fr, fc, tr, tc)) {
        setPendingMove({ fr, fc, tr, tc, kind: 'normal', fromLabel, toLabel })
        setSelectedSquare(null)
        setMessage(`请选择升变棋子（${fromLabel} → ${toLabel}）`)
        return true
      }

      const next = applyNormalMove(gameState, config, fr, fc, tr, tc, promoPiece ?? 'Q')
      return finishMove(
        next,
        'normal',
        { fr, fc, tr, tc, promoPiece: promoPiece ?? 'Q' },
        promoPiece ? `升变${pieceLabel(promoPiece as PromoPiece)}：${fromLabel} → ${toLabel}` : `走棋：${fromLabel} → ${toLabel}`,
      )
    },
    [guardInteraction, gameState, config, finishMove],
  )

  const handlePromotionSelect = async (piece: PromoPiece) => {
    if (!pendingMove || pendingMove.kind !== 'normal') return
    const { fr, fc, tr, tc, fromLabel, toLabel } = pendingMove
    await tryCommitMove(fr, fc, tr, tc, 'normal', fromLabel, toLabel, piece)
  }

  const isSelectableSquare = useCallback(
    (square: string) => {
      if (!playerColor) return isOwnPieceSquareByTurn(gameState, square)
      return isPieceOfColor(gameState, square, playerColor)
    },
    [gameState, playerColor],
  )

  const legalHighlights = useLegalHighlights(
    gameState,
    config,
    selectedSquare,
    teleportMode,
    canPlay && myTurn && !gameOver,
  )

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = { ...legalHighlights }

    if (canPlay && myTurn && !gameOver && selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(201, 162, 39, 0.55)',
      }
    }

    if (outcome.status === 'ongoing' && outcome.inCheck) {
      const kingSq = findKingSquare(gameState, gameState.white_turn)
      if (kingSq) {
        styles[kingSq] = {
          ...styles[kingSq],
          boxShadow: 'inset 0 0 0 4px rgba(239, 68, 68, 0.85)',
        }
      }
    }

    return styles
  }, [legalHighlights, canPlay, myTurn, selectedSquare, gameOver, outcome, gameState])

  const handleSquareClick = useCallback(
    ({ square }: { square: string }) => {
      if (!selectedSquare) {
        if (!guardInteraction(square)) return
        if (isSelectableSquare(square)) {
          setSelectedSquare(square)
          setMessage(teleportMode ? `已选中 ${square}，点击目标格瞬移` : `已选中 ${square}，点击目标格走棋`)
        }
        return
      }

      if (selectedSquare === square) {
        setSelectedSquare(null)
        setMessage('已取消选择')
        return
      }

      if (isSelectableSquare(square)) {
        if (!guardInteraction(square)) return
        setSelectedSquare(square)
        setMessage(teleportMode ? `已选中 ${square}，点击目标格瞬移` : `已选中 ${square}，点击目标格走棋`)
        return
      }

      const [fr, fc] = squareToCoord(selectedSquare)
      const [tr, tc] = squareToCoord(square)
      void tryCommitMove(fr, fc, tr, tc, teleportMode ? 'teleport' : 'normal', selectedSquare, square)
    },
    [selectedSquare, teleportMode, guardInteraction, isSelectableSquare, tryCommitMove],
  )

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string
      targetSquare: string | null
    }) => {
      setIsDragging(false)
      if (!targetSquare || teleportMode || gameOver || pendingMove) return false
      if (!guardInteraction(sourceSquare)) return false

      const [fr, fc] = squareToCoord(sourceSquare)
      const [tr, tc] = squareToCoord(targetSquare)
      void tryCommitMove(fr, fc, tr, tc, 'normal', sourceSquare, targetSquare)
      return true
    },
    [teleportMode, gameOver, pendingMove, guardInteraction, tryCommitMove],
  )

  const boardOrientation: 'white' | 'black' = playerColor === 'black' ? 'black' : 'white'
  const draggingAllowed = canPlay && myTurn && !gameOver && !pendingMove

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      onPieceDrop,
      onSquareClick: handleSquareClick,
      onPieceDrag: () => setIsDragging(true),
      animationDurationInMs: isTouch ? 0 : 100,
      showAnimations: !isTouch,
      boardOrientation,
      allowDragging: draggingAllowed,
      allowAutoScroll: false,
      dragActivationDistance: isTouch ? 12 : 3,
      canDragPiece: ({ square }: { square: string | null }) =>
        !!square && draggingAllowed && isSelectableSquare(square),
      darkSquareStyle: { backgroundColor: BOARD_DARK },
      lightSquareStyle: { backgroundColor: BOARD_LIGHT },
      squareStyles,
      boardStyle: {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 16px 40px -12px rgba(0,0,0,0.55)',
        touchAction: 'none',
      },
      dropSquareStyle: {
        boxShadow: 'inset 0 0 1px 6px rgba(34, 197, 94, 0.65)',
      },
      id: 'teleport-chess',
    }),
    [
      fen,
      onPieceDrop,
      handleSquareClick,
      isTouch,
      boardOrientation,
      draggingAllowed,
      isSelectableSquare,
      squareStyles,
    ],
  )

  useEffect(() => {
    if (!isDragging) return
    const endDrag = () => setIsDragging(false)
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchend', endDrag)
    document.addEventListener('touchcancel', endDrag)
    return () => {
      document.removeEventListener('mouseup', endDrag)
      document.removeEventListener('touchend', endDrag)
      document.removeEventListener('touchcancel', endDrag)
    }
  }, [isDragging])

  useEffect(() => {
    if (!draggingAllowed) setIsDragging(false)
  }, [draggingAllowed])

  const statusColor =
    outcome.status === 'checkmate'
      ? 'text-red-400'
      : outcome.status === 'stalemate'
        ? 'text-sky-400'
        : outcome.status === 'ongoing' && outcome.inCheck
          ? 'text-orange-400'
          : 'text-emerald-400'

  return (
    <main className="game-page">
      <div className="game-layout">
        {/* 手机：上方棋盘；桌面：左侧棋盘 */}
        <section className="game-board-column">
          <div className="chess-board-wrap" ref={boardRef}>
            <Chessboard options={chessboardOptions} />

            {pendingMove && (
              <PromotionDialog
                isWhite={gameState.white_turn}
                onSelect={handlePromotionSelect}
                onCancel={() => {
                  setPendingMove(null)
                  setMessage('已取消升变')
                }}
              />
            )}

            {isOnline && roomStatus === 'waiting' && playerColor === 'white' && (
              <WaitingOverlay roomCode={roomCode!} />
            )}

            {outcome.status === 'checkmate' && (
              <GameOverOverlay
                title="将死 Checkmate"
                subtitle={`${outcome.winner === 'white' ? '白方' : '黑方'}获胜`}
                tone="checkmate"
                onRestart={() => {
                  setGameState(initGame(config))
                  setMessage('本地棋盘已重置（联机需双方重新开局）')
                }}
              />
            )}

            {outcome.status === 'stalemate' && (
              <GameOverOverlay
                title="逼和 Stalemate"
                subtitle="无合法走法且未被将军"
                tone="stalemate"
                onRestart={() => {
                  setGameState(initGame(config))
                  setMessage('本地棋盘已重置')
                }}
              />
            )}
          </div>
        </section>

        {/* 手机：下方信息/记录；桌面：右侧边栏 */}
        <aside className="game-info-column">
          <div className="game-status-grid rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-xs sm:text-sm">
            {isOnline && (
              <>
                <div>
                  <p className="text-white/40">房间号</p>
                  <p className="font-mono font-bold tracking-widest text-purple-400">{roomCode}</p>
                </div>
                <div>
                  <p className="text-white/40">你的阵营</p>
                  <p className="font-semibold text-amber-400">
                    {playerColor ? colorLabel(playerColor) : '—'}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-white/40">当前回合</p>
              <p className="font-semibold text-amber-400">
                {gameOver ? '—' : gameState.white_turn ? '白方' : '黑方'}
              </p>
            </div>
            <div>
              <p className="text-white/40">局面状态</p>
              <p className={`font-semibold ${statusColor}`}>{outcomeLabel(outcome)}</p>
            </div>
            <div>
              <p className="text-white/40">白方瞬移</p>
              <p className="font-semibold">{gameState.white_tp_left} 次</p>
            </div>
            <div>
              <p className="text-white/40">黑方瞬移</p>
              <p className="font-semibold">{gameState.black_tp_left} 次</p>
            </div>
          </div>

          {!myTurn && canPlay && !gameOver && (
            <p className="rounded-lg border border-orange-500/30 bg-orange-950/30 px-3 py-2 text-center text-xs text-orange-300 sm:text-sm">
              等待对手走棋…
            </p>
          )}

          {isTouch && canPlay && !gameOver && (
            <p className="rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2 text-center text-xs text-sky-300 sm:text-sm">
              触屏：点击选子再点目标格，或长按拖拽走棋
            </p>
          )}

          <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-center text-xs text-white/70 sm:text-sm">
            {message}
          </p>

          <div className="mobile-action-bar">
            <button
              type="button"
              disabled={!canPlay || gameOver}
              onClick={() => {
                setTeleportMode((prev) => {
                  const next = !prev
                  setSelectedSquare(null)
                  setMessage(
                    next
                      ? '瞬移模式：点击己方棋子，再点目标格'
                      : '常规模式：点击或拖拽走棋',
                  )
                  return next
                })
              }}
              className={`min-h-11 flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 lg:flex-none ${
                teleportMode
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              {teleportMode ? '⚡ 瞬移 ON' : '常规走棋'}
            </button>

            {isOnline && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="min-h-11 flex-1 rounded-lg border border-red-500/30 px-5 py-2.5 text-sm text-red-300 transition hover:bg-red-950/40 lg:flex-none"
              >
                离开房间
              </button>
            )}
          </div>

          <RuleConfigPanel
            config={config}
            onChange={() => {}}
            readOnly
            title="本局规则"
            hint={
              roomStatus === 'waiting' && playerColor === 'white'
                ? '等待对手加入，规则已锁定'
                : '以下规则由房主在创建房间时设定'
            }
          />
        </aside>
      </div>
    </main>
  )
}

function WaitingOverlay({ roomCode }: { roomCode: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center rounded-[10px] bg-gradient-to-t from-black/80 via-black/20 to-transparent pb-8">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#161622]/95 px-6 py-5 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-white/40">你的房间号是</p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-purple-400">{roomCode}</p>
        <p className="mt-2 text-sm text-white/60">快发给好友吧！</p>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-400/90">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          等待好友加入…
        </p>
        <p className="mt-3 text-xs text-white/40">好友加入后作为黑方，对局开始</p>
      </div>
    </div>
  )
}

function GameOverOverlay({
  title,
  subtitle,
  tone,
  onRestart,
}: {
  title: string
  subtitle: string
  tone: 'checkmate' | 'stalemate'
  onRestart: () => void
}) {
  const isMate = tone === 'checkmate'
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-black/55 backdrop-blur-[2px]">
      <div
        className={`mx-4 w-full max-w-sm rounded-2xl border px-6 py-6 text-center shadow-2xl ${
          isMate
            ? 'border-red-500/40 bg-gradient-to-b from-red-950/90 to-[#161622]'
            : 'border-sky-500/40 bg-gradient-to-b from-sky-950/90 to-[#161622]'
        }`}
      >
        <p className={`text-4xl ${isMate ? 'text-red-400' : 'text-sky-400'}`}>{isMate ? '♚' : '½'}</p>
        <h3 className="mt-2 text-xl font-bold">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{subtitle}</p>
        <button
          type="button"
          onClick={onRestart}
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
            isMate ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'
          }`}
        >
          重置棋盘
        </button>
      </div>
    </div>
  )
}

function findKingSquare(state: GameState, white: boolean): string | null {
  const target = white ? 'K' : 'k'
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (state.board[r][c] === target) return coordToSquare(r, c)
    }
  }
  return null
}

function isOwnPieceSquareByTurn(state: GameState, square: string): boolean {
  const [r, c] = squareToCoord(square)
  const piece = state.board[r][c]
  if (piece === '.') return false
  return state.white_turn ? piece === piece.toUpperCase() : piece === piece.toLowerCase()
}

function pieceLabel(piece: PromoPiece): string {
  return { Q: '后', R: '车', B: '象', N: '马' }[piece]
}
