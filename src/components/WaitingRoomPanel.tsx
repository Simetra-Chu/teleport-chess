import RoomInviteShare from './RoomInviteShare'

interface WaitingRoomPanelProps {
  roomCode: string
}

export function WaitingRoomCard({ roomCode }: WaitingRoomPanelProps) {
  return (
    <div className="waiting-room-card rounded-2xl border border-purple-500/30 bg-[#161622] px-4 py-5 text-center shadow-2xl sm:px-6 sm:py-6">
      <p className="text-xs uppercase tracking-widest text-white/40">你的房间号是</p>
      <p className="mt-2 font-mono text-4xl font-bold tracking-[0.2em] text-purple-400">
        {roomCode}
      </p>
      <RoomInviteShare roomCode={roomCode} />
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-400/90">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        等待好友加入…
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/40">
        好友在浏览器中打开链接即可加入，作为黑方开始对局
      </p>
    </div>
  )
}

/** 桌面端：棋盘上的等待遮罩 */
export default function WaitingRoomPanel({ roomCode }: WaitingRoomPanelProps) {
  return (
    <div className="waiting-overlay">
      <WaitingRoomCard roomCode={roomCode} />
    </div>
  )
}
