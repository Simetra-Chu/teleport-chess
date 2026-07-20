import type { ReactNode } from 'react'
import type { PlayerColor } from '../multiplayer/types'

interface GameRequestBannerProps {
  clockPaused: boolean
  pendingMyPauseRequest: boolean
  pendingMyResumeRequest: boolean
  pendingOpponentPauseRequest: boolean
  pendingOpponentResumeRequest: boolean
  pendingMyUndoRequest: boolean
  pendingMyRestartRequest: boolean
  pendingOpponentUndoRequest: boolean
  pendingOpponentRestartRequest: boolean
  restartFromColor?: PlayerColor | null
  onAcceptPause?: () => void
  onDeclinePause?: () => void
  onAcceptResume?: () => void
  onDeclineResume?: () => void
  onAcceptUndo?: () => void
  onDeclineUndo?: () => void
  onAcceptRestart?: () => void
  onDeclineRestart?: () => void
}

function RequestActions({
  onAccept,
  onDecline,
  acceptLabel = '同意',
}: {
  onAccept: () => void
  onDecline: () => void
  acceptLabel?: string
}) {
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onDecline}
        className="min-h-9 flex-1 rounded-lg border border-white/15 text-xs text-white/70 hover:bg-white/5"
      >
        拒绝
      </button>
      <button
        type="button"
        onClick={onAccept}
        className="min-h-9 flex-1 rounded-lg bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500"
      >
        {acceptLabel}
      </button>
    </div>
  )
}

export default function GameRequestBanner({
  clockPaused,
  pendingMyPauseRequest,
  pendingMyResumeRequest,
  pendingOpponentPauseRequest,
  pendingOpponentResumeRequest,
  pendingMyUndoRequest,
  pendingMyRestartRequest,
  pendingOpponentUndoRequest,
  pendingOpponentRestartRequest,
  restartFromColor,
  onAcceptPause,
  onDeclinePause,
  onAcceptResume,
  onDeclineResume,
  onAcceptUndo,
  onDeclineUndo,
  onAcceptRestart,
  onDeclineRestart,
}: GameRequestBannerProps) {
  const banners: ReactNode[] = []

  if (pendingOpponentUndoRequest && onAcceptUndo && onDeclineUndo) {
    banners.push(
      <div key="undo-req" className="game-request-banner game-request-banner--request">
        <p className="text-sm font-medium text-amber-200">对方请求悔棋，是否同意？</p>
        <RequestActions onAccept={onAcceptUndo} onDecline={onDeclineUndo} />
      </div>,
    )
  }

  if (pendingOpponentRestartRequest && onAcceptRestart && onDeclineRestart) {
    const who = restartFromColor === 'white' ? '白方' : restartFromColor === 'black' ? '黑方' : '对方'
    banners.push(
      <div key="restart-req" className="game-request-banner game-request-banner--request">
        <p className="text-sm font-medium text-amber-200">{who} 请求重新开始一局，是否同意？</p>
        <RequestActions onAccept={onAcceptRestart} onDecline={onDeclineRestart} />
      </div>,
    )
  }

  if (pendingOpponentPauseRequest && onAcceptPause && onDeclinePause) {
    banners.push(
      <div key="pause-req" className="game-request-banner game-request-banner--request">
        <p className="text-sm font-medium text-sky-200">对方请求暂停，是否同意？</p>
        <p className="mt-1 text-xs text-amber-300/85">同意前，对方棋钟仍会继续倒计时。</p>
        <RequestActions onAccept={onAcceptPause} onDecline={onDeclinePause} />
      </div>,
    )
  }

  if (pendingOpponentResumeRequest && onAcceptResume && onDeclineResume) {
    banners.push(
      <div key="resume-req" className="game-request-banner game-request-banner--request">
        <p className="text-sm font-medium text-sky-200">对方请求恢复对局，是否同意？</p>
        <RequestActions onAccept={onAcceptResume} onDecline={onDeclineResume} />
      </div>,
    )
  }

  if (pendingMyUndoRequest) {
    banners.push(
      <div key="undo-wait" className="game-request-banner game-request-banner--waiting">
        <p className="text-sm text-amber-200">悔棋请求中… 等待对方回应</p>
      </div>,
    )
  }

  if (pendingMyRestartRequest) {
    banners.push(
      <div key="restart-wait" className="game-request-banner game-request-banner--waiting">
        <p className="text-sm text-amber-200">重开请求中… 等待对方回应</p>
      </div>,
    )
  }

  if (pendingMyPauseRequest) {
    banners.push(
      <div key="pause-wait" className="game-request-banner game-request-banner--waiting">
        <p className="text-sm text-amber-200">暂停请求中… 等待对方回应</p>
        <p className="mt-1 text-xs text-white/50">对方同意前，你的棋钟仍会继续倒计时。</p>
      </div>,
    )
  }

  if (pendingMyResumeRequest) {
    banners.push(
      <div key="resume-wait" className="game-request-banner game-request-banner--waiting">
        <p className="text-sm text-amber-200">恢复请求中… 等待对方回应</p>
      </div>,
    )
  }

  if (clockPaused) {
    banners.push(
      <div key="paused" className="game-request-banner game-request-banner--paused">
        <p className="flex items-center gap-2 text-sm font-medium text-orange-200">
          <span aria-hidden>⏸</span>
          对局已暂停
        </p>
        <p className="mt-1 text-xs text-white/55">棋盘仍可查看，暂不可走棋。点击「请求恢复」继续。</p>
      </div>,
    )
  }

  if (banners.length === 0) return null

  return <div className="game-request-banner-stack space-y-2">{banners}</div>
}
