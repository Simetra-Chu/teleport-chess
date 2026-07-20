import { useEffect, useState } from 'react'
import GameView from './components/GameView'
import LobbyPanel from './components/LobbyPanel'
import AutoJoinSplash from './components/AutoJoinSplash'
import TutorialModal from './components/TutorialModal'
import TutorialButton from './components/TutorialButton'
import { useMultiplayer } from './multiplayer/useMultiplayer'

export default function App() {
  const mp = useMultiplayer()
  const { autoJoinError, clearAutoJoinError } = mp
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)

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
      await mp.joinRoom()
    } catch (e) {
      setLobbyError(e instanceof Error ? e.message : '加入房间失败')
    }
  }

  const showLobby = mp.phase === 'lobby' && !mp.autoJoining

  return (
    <div className="app-shell min-h-[100dvh] overflow-x-hidden text-stone-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-[var(--page-x)] py-3 sm:gap-4 sm:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">瞬移国际象棋</h1>
            <p className="truncate text-[11px] text-white/45 sm:text-xs">
              {mp.autoJoining
                ? `正在加入房间 ${mp.autoJoinRoomCode ?? ''}…`
                : mp.phase === 'lobby'
                  ? '联机对战 · 创建或加入房间'
                  : `房间 ${mp.roomCode} · ${
                      mp.roomStatus === 'waiting'
                        ? '等待对手'
                        : mp.roomStatus === 'finished'
                          ? '对局已结束'
                          : '在线对战中'
                    }`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <TutorialButton onClick={() => setTutorialOpen(true)} variant="header" />

            {mp.phase === 'room' && (
              <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 sm:inline sm:px-4 sm:py-1.5">
                {mp.playerColor
                  ? `你执${mp.playerColor === 'white' ? '白' : '黑'}`
                  : '联机中'}
              </span>
            )}
          </div>
        </div>
      </header>

      <TutorialModal
        open={tutorialOpen && showLobby}
        onClose={() => setTutorialOpen(false)}
      />

      {mp.phase === 'room' && (
        <TutorialButton onClick={() => setTutorialOpen(true)} variant="float" />
      )}

      {mp.autoJoining ? (
        <AutoJoinSplash roomCode={mp.autoJoinRoomCode ?? '----'} />
      ) : showLobby ? (
        <LobbyPanel
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
        />
      )}
    </div>
  )
}
