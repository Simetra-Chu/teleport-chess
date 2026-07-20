import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
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
import RuleConfigPanel from './RuleConfigPanel'
import TeleportModeButton from './TeleportModeButton'
import GameTutorialOverlay from './GameTutorialOverlay'
import GameControlBar from './GameControlBar'
import RoomInviteShare from './RoomInviteShare'
import ChessClockDisplay from './ChessClockDisplay'
import GameRequestBanner from './GameRequestBanner'
import GameChatPanel from './GameChatPanel'
import type {
  ChatMessage,
  GameResult,
  OpponentRequestEvent,
  PauseRequestEvent,
  PlayerColor,
  ResumeRequestEvent,
  RoomStatus,
  UndoRequestEvent,
} from '../multiplayer/types'

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
  interactiveTutorial?: boolean
  onTutorialClose?: () => void
  gameResult?: GameResult | null
  canRequestUndo?: boolean
  pendingOpponentUndoRequest?: UndoRequestEvent | null
  pendingMyUndoRequest?: boolean
  pendingOpponentRestartRequest?: OpponentRequestEvent | null
  pendingMyRestartRequest?: boolean
  whiteTime?: number
  blackTime?: number
  clockPaused?: boolean
  activeClockColor?: PlayerColor | null
  timePerSideMinutes?: number
  pendingOpponentPauseRequest?: PauseRequestEvent | null
  pendingMyPauseRequest?: boolean
  pendingOpponentResumeRequest?: ResumeRequestEvent | null
  pendingMyResumeRequest?: boolean
  requestNotice?: string | null
  chatMessages?: ChatMessage[]
  canChat?: boolean
  onSendChatMessage?: (text: string) => Promise<void>
  onResign?: () => Promise<void>
  onRequestUndo?: () => Promise<void>
  onAcceptUndo?: () => Promise<void>
  onDeclineUndo?: () => Promise<void>
  onRequestRestart?: () => Promise<void>
  onRespondToRestartRequest?: (accept: boolean) => Promise<void>
  onRequestPause?: () => Promise<void>
  onAcceptPause?: () => Promise<void>
  onDeclinePause?: () => Promise<void>
  onRequestResume?: () => Promise<void>
  onAcceptResume?: () => Promise<void>
  onDeclineResume?: () => Promise<void>
  onClearRequestNotice?: () => void
  onRecordLastMove?: (by: PlayerColor) => void
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
  interactiveTutorial = false,
  onTutorialClose,
  gameResult = null,
  canRequestUndo = false,
  pendingOpponentUndoRequest = null,
  pendingMyUndoRequest = false,
  pendingOpponentRestartRequest = null,
  pendingMyRestartRequest = false,
  whiteTime = 0,
  blackTime = 0,
  clockPaused = false,
  activeClockColor = null,
  timePerSideMinutes = 10,
  pendingOpponentPauseRequest = null,
  pendingMyPauseRequest = false,
  pendingOpponentResumeRequest = null,
  pendingMyResumeRequest = false,
  requestNotice = null,
  chatMessages = [],
  canChat = false,
  onSendChatMessage,
  onResign,
  onRequestUndo,
  onAcceptUndo,
  onDeclineUndo,
  onRequestRestart,
  onRespondToRestartRequest,
  onRequestPause,
  onAcceptPause,
  onDeclinePause,
  onRequestResume,
  onAcceptResume,
  onDeclineResume,
  onClearRequestNotice,
  onRecordLastMove,
}: GameViewProps) {
  const [teleportMode, setTeleportMode] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [message, setMessage] = useState('点击己方棋子，再点目标格走棋')

  const isTouch = useIsTouchDevice()

  const toggleTeleportMode = useCallback(() => {
    setTeleportMode((prev) => {
      const next = !prev
      setSelectedSquare(null)
      setMessage(
        next ? '瞬移模式已激活：点击己方棋子，再点紫色高亮格' : '已切回常规走棋模式',
      )
      return next
    })
  }, [])

  const respond = useCallback(
    (fn?: () => Promise<void>) => () => {
      if (!fn) return
      void fn().catch((e) => setMessage(e instanceof Error ? e.message : '回应失败'))
    },
    [],
  )

  const myTurn = isMyTurn(gameState, playerColor)
  const canPlay = !isOnline || (roomStatus === 'playing' && !clockPaused)
  const resigned = gameResult?.reason === 'resign'
  const timedOut = gameResult?.reason === 'timeout'
  const fen = useMemo(() => boardToFen(gameState), [gameState])
  const outcome = useMemo(() => getGameOutcome(gameState, config), [gameState, config])
  const gameOver = outcome.status !== 'ongoing' || resigned || timedOut

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

  useEffect(() => {
    if (requestNotice) {
      setMessage(requestNotice)
      onClearRequestNotice?.()
    }
  }, [requestNotice, onClearRequestNotice])

  useEffect(() => {
    if (resigned && gameResult) {
      const winner = gameResult.winner === 'white' ? '白方' : '黑方'
      setMessage(`${winner}获胜（对手认输）`)
    }
  }, [resigned, gameResult])

  useEffect(() => {
    if (timedOut && gameResult) {
      const winner = gameResult.winner === 'white' ? '白方' : '黑方'
      setMessage(`${winner}获胜（对手超时）`)
    }
  }, [timedOut, gameResult])

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

      if (isOnline && playerColor) onRecordLastMove?.(playerColor)

      if (kind === 'teleport') {
        setTeleportMode(false)
        setMessage((prev) => (prev.includes('已切回普通走棋') ? prev : `${prev} · 已切回普通走棋`))
      }
      return true
    },
    [gameState, syncToServer, applyLocalOutcome, setGameState, isOnline, playerColor, onRecordLastMove],
  )

  const guardInteraction = useCallback(
    (square?: string): boolean => {
      if (!canPlay) {
        setMessage(clockPaused ? '对局已暂停，无法走棋' : '等待好友加入…')
        return false
      }
      if (gameOver) return false
      // 升变待选时禁止新的选子/走棋（升变确认走 handlePromotionSelect 单独处理）
      if (pendingMove) return false

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
    if (gameOver || !canPlay) return

    const { fr, fc, tr, tc, fromLabel, toLabel } = pendingMove

    const check = checkCanInteract(gameState, playerColor, fromLabel, isOnline)
    if (!check.ok) {
      setMessage(check.msg!)
      return
    }

    const result = checkNormalMoveValid(gameState, config, fr, fc, tr, tc, piece)
    if (!result.valid) {
      setMessage(result.msg)
      setPendingMove(null)
      return
    }

    const next = applyNormalMove(gameState, config, fr, fc, tr, tc, piece)
    await finishMove(
      next,
      'normal',
      { fr, fc, tr, tc, promoPiece: piece },
      `升变${pieceLabel(piece)}：${fromLabel} → ${toLabel}`,
    )
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

  const boardOrientation: 'white' | 'black' = playerColor === 'black' ? 'black' : 'white'

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      onSquareClick: handleSquareClick,
      animationDurationInMs: isTouch ? 0 : 100,
      showAnimations: !isTouch,
      boardOrientation,
      allowDragging: false,
      allowAutoScroll: false,
      darkSquareStyle: { backgroundColor: BOARD_DARK },
      lightSquareStyle: { backgroundColor: BOARD_LIGHT },
      squareStyles,
      boardStyle: {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 16px 40px -12px rgba(0,0,0,0.55)',
        touchAction: 'manipulation',
      },
      id: 'teleport-chess',
    }),
    [fen, handleSquareClick, isTouch, boardOrientation, squareStyles],
  )

  const statusColor =
    outcome.status === 'checkmate'
      ? 'text-red-400'
      : outcome.status === 'stalemate'
        ? 'text-sky-400'
        : outcome.status === 'ongoing' && outcome.inCheck
          ? 'text-orange-400'
          : 'text-emerald-400'

  const chatPanel =
    isOnline && onSendChatMessage ? (
      <GameChatPanel
        messages={chatMessages}
        playerColor={playerColor}
        disabled={!canChat}
        disabledHint={
          roomStatus === 'waiting'
            ? '等待对手加入后可聊天'
            : '当前无法发送消息'
        }
        onSend={onSendChatMessage}
      />
    ) : null

  return (
    <main className="game-page">
      <div className="game-layout">
        {/* 手机：上方棋盘；桌面：左侧棋盘 */}
        <section className="game-board-column">
          <div className="chess-board-stack">
            <div className="chess-board-wrap">
              <Chessboard options={chessboardOptions} />
            </div>

            {pendingMove && (
              <div className="chess-board-overlay">
                <PromotionDialog
                  isWhite={gameState.white_turn}
                  onSelect={handlePromotionSelect}
                  onCancel={() => {
                    setPendingMove(null)
                    setMessage('已取消升变')
                  }}
                />
              </div>
            )}

            {isOnline && roomStatus === 'waiting' && playerColor === 'white' && (
              <div className="chess-board-overlay">
                <WaitingOverlay roomCode={roomCode!} />
              </div>
            )}

            {outcome.status === 'checkmate' && !resigned && !timedOut && (
              <div className="chess-board-overlay">
                <GameOverOverlay
                  title="将死 Checkmate"
                  subtitle={`${outcome.winner === 'white' ? '白方' : '黑方'}获胜`}
                  tone="checkmate"
                  onRestart={() => {
                    setGameState(initGame(config))
                    setMessage('本地棋盘已重置（联机需双方重新开局）')
                  }}
                />
              </div>
            )}

            {outcome.status === 'stalemate' && !resigned && !timedOut && (
              <div className="chess-board-overlay">
                <GameOverOverlay
                  title="逼和 Stalemate"
                  subtitle="无合法走法且未被将军"
                  tone="stalemate"
                  onRestart={() => {
                    setGameState(initGame(config))
                    setMessage('本地棋盘已重置')
                  }}
                />
              </div>
            )}
            {resigned && gameResult && (
              <div className="chess-board-overlay">
                <GameOverOverlay
                  title="认输 Resign"
                  subtitle={`${gameResult.winner === 'white' ? '白方' : '黑方'}获胜`}
                  tone="resign"
                  actionLabel="返回大厅"
                  onRestart={onLeaveRoom}
                />
              </div>
            )}
            {timedOut && gameResult && (
              <div className="chess-board-overlay">
                <GameOverOverlay
                  title="超时 Time Out"
                  subtitle={`${gameResult.winner === 'white' ? '白方' : '黑方'}获胜（对手用时耗尽）`}
                  tone="timeout"
                  actionLabel="返回大厅"
                  onRestart={onLeaveRoom}
                />
              </div>
            )}
          </div>

          {isOnline && roomStatus === 'playing' && (
            <GameRequestBanner
              clockPaused={clockPaused}
              pendingMyPauseRequest={pendingMyPauseRequest}
              pendingMyResumeRequest={pendingMyResumeRequest}
              pendingOpponentPauseRequest={!!pendingOpponentPauseRequest}
              pendingOpponentResumeRequest={!!pendingOpponentResumeRequest}
              pendingMyUndoRequest={pendingMyUndoRequest}
              pendingMyRestartRequest={pendingMyRestartRequest}
              pendingOpponentUndoRequest={!!pendingOpponentUndoRequest}
              pendingOpponentRestartRequest={!!pendingOpponentRestartRequest}
              restartFromColor={pendingOpponentRestartRequest?.from ?? null}
              onAcceptPause={onAcceptPause ? respond(onAcceptPause) : undefined}
              onDeclinePause={onDeclinePause ? respond(onDeclinePause) : undefined}
              onAcceptResume={onAcceptResume ? respond(onAcceptResume) : undefined}
              onDeclineResume={onDeclineResume ? respond(onDeclineResume) : undefined}
              onAcceptUndo={onAcceptUndo ? respond(onAcceptUndo) : undefined}
              onDeclineUndo={onDeclineUndo ? respond(onDeclineUndo) : undefined}
              onAcceptRestart={
                onRespondToRestartRequest
                  ? respond(() => onRespondToRestartRequest(true))
                  : undefined
              }
              onDeclineRestart={
                onRespondToRestartRequest
                  ? respond(() => onRespondToRestartRequest(false))
                  : undefined
              }
            />
          )}

          {chatPanel && <div className="game-board-chat">{chatPanel}</div>}
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

          {isOnline && roomStatus === 'playing' && (
            <ChessClockDisplay
              whiteTime={whiteTime}
              blackTime={blackTime}
              activeColor={activeClockColor}
              paused={clockPaused}
              playerColor={playerColor}
            />
          )}

          {isOnline && roomStatus === 'playing' && (
            <p className="text-center text-[11px] text-white/35">
              包干制 · 每方 {timePerSideMinutes} 分钟
            </p>
          )}

          {!myTurn && canPlay && !gameOver && (
            <p className="rounded-lg border border-orange-500/30 bg-orange-950/30 px-3 py-2 text-center text-xs text-orange-300 sm:text-sm">
              等待对手走棋…
            </p>
          )}

          {isTouch && canPlay && !gameOver && (
            <p className="rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2 text-center text-xs text-sky-300 sm:text-sm">
              触屏：先点己方子，再点目标格走棋
            </p>
          )}

          {isOnline && roomStatus === 'waiting' && playerColor === 'white' && roomCode && (
            <RoomInviteShare roomCode={roomCode} variant="inline" />
          )}

          <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-center text-xs text-white/70 sm:text-sm">
            {message}
          </p>

          <div className="mobile-action-bar">
            <TeleportModeButton
              teleportMode={teleportMode}
              disabled={!canPlay || gameOver}
              onToggle={toggleTeleportMode}
            />

            {isOnline && roomStatus === 'playing' && onResign && onRequestUndo && onRequestRestart && (
              <GameControlBar
                disabled={gameOver}
                canRequestUndo={canRequestUndo}
                pendingMyUndoRequest={pendingMyUndoRequest}
                pendingMyRestartRequest={pendingMyRestartRequest}
                clockPaused={clockPaused}
                pendingMyPauseRequest={pendingMyPauseRequest}
                pendingMyResumeRequest={pendingMyResumeRequest}
                onResign={() => {
                  if (!window.confirm('确定要认输吗？')) return
                  void onResign().catch((e) =>
                    setMessage(e instanceof Error ? e.message : '认输失败'),
                  )
                }}
                onRequestUndo={() => {
                  if (!canRequestUndo) {
                    setMessage('你只能在自己走完棋后请求悔棋')
                    return
                  }
                  void onRequestUndo().catch((e) =>
                    setMessage(e instanceof Error ? e.message : '请求悔棋失败'),
                  )
                }}
                onRequestPause={() => {
                  void onRequestPause?.().catch((e) =>
                    setMessage(e instanceof Error ? e.message : '请求暂停失败'),
                  )
                }}
                onRequestResume={() => {
                  void onRequestResume?.().catch((e) =>
                    setMessage(e instanceof Error ? e.message : '请求恢复失败'),
                  )
                }}
                onRequestRestart={() => {
                  if (!window.confirm('向对手请求重新开始本局？')) return
                  void onRequestRestart().catch((e) =>
                    setMessage(e instanceof Error ? e.message : '请求重开失败'),
                  )
                }}
              />
            )}

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

      <GameTutorialOverlay
        open={interactiveTutorial}
        teleportMode={teleportMode}
        onClose={() => onTutorialClose?.()}
      />
    </main>
  )
}

function WaitingOverlay({ roomCode }: { roomCode: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center rounded-[10px] bg-gradient-to-t from-black/80 via-black/20 to-transparent pb-8">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#161622]/95 px-6 py-5 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-white/40">你的房间号是</p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-purple-400">{roomCode}</p>
        <RoomInviteShare roomCode={roomCode} />
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-400/90">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          等待好友加入…
        </p>
        <p className="mt-3 text-xs text-white/40">好友在浏览器中打开链接即可加入，作为黑方开始对局</p>
      </div>
    </div>
  )
}

function GameOverOverlay({
  title,
  subtitle,
  tone,
  actionLabel,
  onRestart,
}: {
  title: string
  subtitle: string
  tone: 'checkmate' | 'stalemate' | 'resign' | 'timeout'
  actionLabel?: string
  onRestart: () => void
}) {
  const isMate = tone === 'checkmate'
  const isResign = tone === 'resign'
  const isTimeout = tone === 'timeout'
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-black/55 backdrop-blur-[2px]">
      <div
        className={`mx-4 w-full max-w-sm rounded-2xl border px-6 py-6 text-center shadow-2xl ${
          isTimeout
            ? 'border-red-500/40 bg-gradient-to-b from-red-950/90 to-[#161622]'
            : isResign
              ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/90 to-[#161622]'
              : isMate
                ? 'border-red-500/40 bg-gradient-to-b from-red-950/90 to-[#161622]'
                : 'border-sky-500/40 bg-gradient-to-b from-sky-950/90 to-[#161622]'
        }`}
      >
        <p
          className={`text-4xl ${
            isTimeout ? 'text-red-400' : isResign ? 'text-amber-400' : isMate ? 'text-red-400' : 'text-sky-400'
          }`}
        >
          {isTimeout ? '⏱' : isResign ? '🏳' : isMate ? '♚' : '½'}
        </p>
        <h3 className="mt-2 text-xl font-bold">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{subtitle}</p>
        <button
          type="button"
          onClick={onRestart}
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
            isTimeout || isMate
              ? 'bg-red-600 hover:bg-red-500'
              : isResign
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-sky-600 hover:bg-sky-500'
          }`}
        >
          {actionLabel ?? '重置棋盘'}
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
