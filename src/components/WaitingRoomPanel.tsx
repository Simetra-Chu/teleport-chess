import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMobileGameLayout } from '../hooks/useMobileGameLayout'
import RoomInviteShare from './RoomInviteShare'

interface WaitingRoomPanelProps {
  roomCode: string
}

function WaitingRoomCard({ roomCode }: WaitingRoomPanelProps) {
  return (
    <div className="waiting-room-card rounded-2xl border border-purple-500/30 bg-[#161622]/98 px-4 py-4 text-center shadow-2xl sm:px-6 sm:py-5">
      <p className="text-[10px] uppercase tracking-widest text-white/40 sm:text-xs">你的房间号是</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-purple-400 sm:mt-2 sm:text-4xl sm:tracking-[0.25em]">
        {roomCode}
      </p>
      <RoomInviteShare roomCode={roomCode} />
      <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-400/90">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        等待好友加入…
      </p>
      <p className="mt-2 text-xs text-white/40">好友在浏览器中打开链接即可加入，作为黑方开始对局</p>
    </div>
  )
}

export default function WaitingRoomPanel({ roomCode }: WaitingRoomPanelProps) {
  const mobile = useMobileGameLayout()

  useEffect(() => {
    if (!mobile) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobile])

  if (mobile) {
    return createPortal(
      <div
        className="waiting-room-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`等待对手加入房间 ${roomCode}`}
      >
        <div className="waiting-room-modal-panel">
          <WaitingRoomCard roomCode={roomCode} />
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <div className="waiting-overlay">
      <WaitingRoomCard roomCode={roomCode} />
    </div>
  )
}
