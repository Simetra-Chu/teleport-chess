import { useMemo, useState } from 'react'
import { buildRoomInviteUrl, copyToClipboard } from '../utils/roomLink'

interface RoomInviteShareProps {
  roomCode: string
  variant?: 'card' | 'inline'
}

export default function RoomInviteShare({ roomCode, variant = 'card' }: RoomInviteShareProps) {
  const inviteUrl = useMemo(() => buildRoomInviteUrl(roomCode), [roomCode])
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    setCopyError(null)
    try {
      await copyToClipboard(inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 3000)
    } catch (e) {
      setCopied(false)
      setCopyError(e instanceof Error ? e.message : '复制失败')
    }
  }

  if (variant === 'inline') {
    return (
      <div className="room-invite-inline">
        <p className="text-xs text-white/45">邀请链接</p>
        <p className="room-invite-url mt-1 break-all text-[11px] text-white/55">{inviteUrl}</p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="room-invite-copy-btn mt-2 w-full min-h-10 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          {copied ? '已复制邀请链接，快发给好友吧！' : '复制邀请链接'}
        </button>
        {copyError && <p className="mt-1 text-xs text-red-300">{copyError}</p>}
      </div>
    )
  }

  return (
    <div className="room-invite-card mt-4 rounded-xl border border-purple-500/25 bg-purple-950/20 p-4 text-left">
      <p className="text-xs font-medium text-purple-300/90">邀请链接</p>
      <p className="room-invite-url mt-2 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] leading-relaxed text-white/60 sm:text-xs">
        {inviteUrl}
      </p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="room-invite-copy-btn mt-3 w-full min-h-11 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-[0.98]"
      >
        {copied ? '已复制邀请链接，快发给好友吧！' : '复制邀请链接'}
      </button>
      {copyError && (
        <p className="mt-2 text-center text-xs text-red-300">{copyError}</p>
      )}
    </div>
  )
}
