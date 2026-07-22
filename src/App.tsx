import { useEffect, useState } from 'react'
import JoinRoomConfirmPanel from './components/JoinRoomConfirmPanel'
import GameView from './components/GameView'
import LobbyPanel, { type LobbyMode } from './components/LobbyPanel'
import AutoJoinSplash from './components/AutoJoinSplash'
import TutorialModal from './components/TutorialModal'
import TutorialButton from './components/TutorialButton'
import { useMultiplayer } from './multiplayer/useMultiplayer'
import { usePvE } from './pve/usePvE'
import { AI_DIFFICULTY_LABELS } from './ai/types'
import type { PlayerColor } from './multiplayer/types'

export default function App() {
  const mp = useMultiplayer()
  const pve = usePvE()
  const { autoJoinError, clearAutoJoinError } = mp
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [joinConfirmError, setJoinConfirmError] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [lobbyMode, setLobbyMode] = useState<LobbyMode>('online')
  const [pveLobbyColor, setPveLobbyColor] = useState<PlayerColor>('white')

  useEffect(() => {
    if (!autoJoinError) return
    setLobbyError(autoJoinError)
    clearAutoJoinError()
  }, [autoJoinError, clearAutoJoinError])

  const handleCreate = async () => {
    setLobbyError(null)
    try {
      await mp.createRoom()
    } catch (e) {
      setLobbyError(e instanceof Error ? e.message : '创建房间失败')
    }
  }

  const handleJoin = async () => {
    setLobbyError(null)
    try {
      await mp.previewRoom()
    } catch (e) {
      setLobbyError(e instanceof Error ? e.message : '查询房间失败')
    }
  }

  const handleConfirmJoin = async () => {
    setJoinConfirmError(null)
    try {
      await mp.confirmJoinRoom()
    } catch (e) {
      setJoinConfirmError(e instanceof Error ? e.message : '加入房间失败')
    }
  }

  const handleCancelJoinPreview = () => {
    setJoinConfirmError(null)
    mp.cancelJoinPreview()
  }

  const handleStartPvE = () => {
    pve.startGame(pveLobbyColor, pve.difficulty, pve.config)
  }

  const inPvEGame = pve.phase === 'game'
  const inOnlineGame = mp.phase === 'room'
  const showLobby =
    !inPvEGame && !inOnlineGame && !mp.autoJoining && !mp.joinPreview

  const headerSubtitle = inPvEGame
    ? `单机人机 · ${AI_DIFFICULTY_LABELS[pve.difficulty]} · 你执${pve.playerColor === 'white' ? '白' : '黑'}`
    : mp.autoJoining
      ? `正在加载房间 ${mp.autoJoinRoomCode ?? ''} 规则…`
      : mp.joinPreview
        ? `确认加入房间 ${mp.joinPreview.roomCode}`
        : showLobby
          ? lobbyMode === 'pve'
            ? '单机人机 · 选择难度与阵营'
            : '联机对战 · 创建或加入房间'
          : `房间 ${mp.roomCode} · ${
              mp.roomStatus === 'waiting'
                ? '等待对手'
                : mp.roomStatus === 'finished'
                  ? '对局已结束'
                  : '在线对战中'
            }`

  return (
    <div className="app-shell app-shell--with-header min-h-[100dvh] text-stone-100">
      <header className="app-header sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-[var(--page-x)] py-3 sm:gap-4 sm:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">瞬移国际象棋</h1>
            <p className="truncate text-[11px] text-white/45 sm:text-xs">{headerSubtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <TutorialButton onClick={() => setTutorialOpen(true)} variant="header" />

            {inOnlineGame && (
              <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 sm:inline sm:px-4 sm:py-1.5">
                {mp.playerColor
                  ? `你执${mp.playerColor === 'white' ? '白' : '黑'}`
                  : '联机中'}
              </span>
            )}

            {inPvEGame && (
              <span className="hidden rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 sm:inline sm:px-4 sm:py-1.5">
                vs AI
              </span>
            )}
          </div>
        </div>
      </header>

      <TutorialModal
        open={tutorialOpen && showLobby}
        onClose={() => setTutorialOpen(false)}
      />

      {((inOnlineGame && mp.roomStatus !== 'waiting') || inPvEGame) && (
        <TutorialButton onClick={() => setTutorialOpen(true)} variant="float" />
      )}

      {mp.autoJoining ? (
        <AutoJoinSplash roomCode={mp.autoJoinRoomCode ?? '----'} />
      ) : mp.joinPreview ? (
        <JoinRoomConfirmPanel
          preview={mp.joinPreview}
          loading={mp.loading}
          error={joinConfirmError ?? mp.joinPreviewError}
          onConfirm={handleConfirmJoin}
          onCancel={handleCancelJoinPreview}
        />
      ) : showLobby ? (
        <LobbyPanel
          lobbyMode={lobbyMode}
          onLobbyModeChange={setLobbyMode}
          joinInput={mp.joinInput}
          loading={mp.loading}
          config={mp.config}
          onConfigChange={mp.patchConfig}
          timePreset={mp.timePreset}
          customMinutes={mp.customMinutes}
          onTimePresetChange={mp.setTimePreset}
          onCustomMinutesChange={mp.setCustomMinutes}
          onJoinInputChange={mp.setJoinInput}
          onCreateRoom={handleCreate}
          onJoinRoom={handleJoin}
          onOpenTutorial={() => setTutorialOpen(true)}
          error={lobbyError}
          pveDifficulty={pve.difficulty}
          onPveDifficultyChange={pve.setDifficulty}
          pveColor={pveLobbyColor}
          onPveColorChange={setPveLobbyColor}
          onStartPvE={handleStartPvE}
          pveConfig={pve.config}
          onPveConfigChange={pve.patchConfig}
        />
      ) : inPvEGame ? (
        <GameView
          config={pve.config}
          gameState={pve.gameState}
          setGameState={pve.setGameState}
          playerColor={pve.playerColor}
          roomCode="人机"
          roomStatus="playing"
          isOnline={false}
          isPvE
          aiThinking={pve.aiThinking}
          aiDifficulty={pve.difficulty}
          onLeaveRoom={pve.leaveGame}
          onOpponentSync={() => () => {}}
          interactiveTutorial={tutorialOpen}
          onTutorialClose={() => setTutorialOpen(false)}
          gameResult={pve.gameResult}
          onResign={pve.resign}
          onRestartLocal={pve.restartGame}
        />
      ) : (
        <GameView
          config={mp.config}
          gameState={mp.gameState}
          setGameState={mp.setGameState}
          playerColor={mp.playerColor}
          roomCode={mp.roomCode}
          roomStatus={mp.roomStatus}
          isOnline={mp.isOnline}
          onLeaveRoom={mp.leaveRoom}
          onOpponentSync={mp.onOpponentSync}
          interactiveTutorial={tutorialOpen}
          onTutorialClose={() => setTutorialOpen(false)}
          gameResult={mp.gameResult}
          canRequestUndo={mp.canRequestUndo}
          pendingOpponentUndoRequest={mp.pendingOpponentUndoRequest}
          pendingMyUndoRequest={mp.pendingMyUndoRequest}
          pendingOpponentRestartRequest={mp.pendingOpponentRestartRequest}
          pendingMyRestartRequest={mp.pendingMyRestartRequest}
          requestNotice={mp.requestNotice}
          onResign={mp.resign}
          onRequestUndo={mp.requestUndo}
          onAcceptUndo={mp.acceptUndo}
          onDeclineUndo={mp.declineUndo}
          onRequestRestart={mp.requestRestart}
          onRespondToRestartRequest={mp.respondToRestartRequest}
          onRequestPause={mp.requestPause}
          onAcceptPause={mp.acceptPause}
          onDeclinePause={mp.declinePause}
          onRequestResume={mp.requestResume}
          onAcceptResume={mp.acceptResume}
          onDeclineResume={mp.declineResume}
          onClearRequestNotice={mp.clearRequestNotice}
          onRecordLastMove={mp.recordLastMove}
          whiteTime={mp.whiteTime}
          blackTime={mp.blackTime}
          clockPaused={mp.clockPaused}
          activeClockColor={mp.activeClockColor}
          timePerSideMinutes={mp.timePerSideMinutes}
          pendingOpponentPauseRequest={mp.pendingOpponentPauseRequest}
          pendingMyPauseRequest={mp.pendingMyPauseRequest}
          pendingOpponentResumeRequest={mp.pendingOpponentResumeRequest}
          pendingMyResumeRequest={mp.pendingMyResumeRequest}
          chatMessages={mp.chatMessages}
          canChat={mp.canChat}
          onSendChatMessage={mp.sendChatMessage}
        />
      )}
    </div>
  )
}
