import { useState } from 'react'
import GameView from './components/GameView'
import LobbyPanel from './components/LobbyPanel'
import TutorialModal from './components/TutorialModal'
import TutorialButton from './components/TutorialButton'
import { useMultiplayer } from './multiplayer/useMultiplayer'

export default function App() {
  const mp = useMultiplayer()
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)

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

  return (
    <div className="min-h-screen text-stone-100">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">瞬移国际象棋</h1>
            <p className="text-xs text-white/45">
              {mp.phase === 'lobby'
                ? '联机对战 · 创建或加入房间'
                : `房间 ${mp.roomCode} · ${mp.roomStatus === 'waiting' ? '等待对手' : '在线对战中'}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TutorialButton onClick={() => setTutorialOpen(true)} variant="header" />

            {mp.phase === 'room' && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400">
                {mp.playerColor
                  ? `你执${mp.playerColor === 'white' ? '白' : '黑'}`
                  : '联机中'}
              </span>
            )}
          </div>
        </div>
      </header>

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      {mp.phase === 'room' && (
        <TutorialButton onClick={() => setTutorialOpen(true)} variant="float" />
      )}

      {mp.phase === 'lobby' ? (
        <LobbyPanel
          joinInput={mp.joinInput}
          loading={mp.loading}
          config={mp.config}
          onConfigChange={mp.patchConfig}
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
        />
      )}
    </div>
  )
}
