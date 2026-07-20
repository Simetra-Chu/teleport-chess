interface PauseStatusBannerProps {
  clockPaused: boolean
  pendingMyPauseRequest: boolean
  pendingMyResumeRequest: boolean
  pendingOpponentPauseRequest: boolean
  pendingOpponentResumeRequest: boolean
  onAcceptPause?: () => void
  onDeclinePause?: () => void
  onAcceptResume?: () => void
  onDeclineResume?: () => void
}

export default function PauseStatusBanner({
  clockPaused,
  pendingMyPauseRequest,
  pendingMyResumeRequest,
  pendingOpponentPauseRequest,
  pendingOpponentResumeRequest,
  onAcceptPause,
  onDeclinePause,
  onAcceptResume,
  onDeclineResume,
}: PauseStatusBannerProps) {
  if (pendingOpponentPauseRequest && onAcceptPause && onDeclinePause) {
    return (
      <div className="pause-status-banner pause-status-banner--request">
        <p className="text-sm font-medium text-sky-200">对方请求暂停，是否同意？</p>
        <p className="mt-1 text-xs text-amber-300/85">同意前，对方棋钟仍会继续倒计时。</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDeclinePause}
            className="min-h-9 flex-1 rounded-lg border border-white/15 text-xs text-white/70 hover:bg-white/5"
          >
            拒绝
          </button>
          <button
            type="button"
            onClick={onAcceptPause}
            className="min-h-9 flex-1 rounded-lg bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500"
          >
            同意
          </button>
        </div>
      </div>
    )
  }

  if (pendingOpponentResumeRequest && onAcceptResume && onDeclineResume) {
    return (
      <div className="pause-status-banner pause-status-banner--request">
        <p className="text-sm font-medium text-sky-200">对方请求恢复对局，是否同意？</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDeclineResume}
            className="min-h-9 flex-1 rounded-lg border border-white/15 text-xs text-white/70 hover:bg-white/5"
          >
            拒绝
          </button>
          <button
            type="button"
            onClick={onAcceptResume}
            className="min-h-9 flex-1 rounded-lg bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500"
          >
            同意
          </button>
        </div>
      </div>
    )
  }

  if (pendingMyPauseRequest) {
    return (
      <div className="pause-status-banner pause-status-banner--waiting">
        <p className="text-sm text-amber-200">暂停请求中… 等待对方回应</p>
        <p className="mt-1 text-xs text-white/50">对方同意前，你的棋钟仍会继续倒计时。</p>
      </div>
    )
  }

  if (pendingMyResumeRequest) {
    return (
      <div className="pause-status-banner pause-status-banner--waiting">
        <p className="text-sm text-amber-200">恢复请求中… 等待对方回应</p>
      </div>
    )
  }

  if (clockPaused) {
    return (
      <div className="pause-status-banner pause-status-banner--paused">
        <p className="flex items-center gap-2 text-sm font-medium text-orange-200">
          <span aria-hidden>⏸</span>
          对局已暂停
        </p>
        <p className="mt-1 text-xs text-white/55">棋盘仍可查看，暂不可走棋。点击「请求恢复」继续。</p>
      </div>
    )
  }

  return null
}
