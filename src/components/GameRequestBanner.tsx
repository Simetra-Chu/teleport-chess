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
  prominent = false,
}: {
  onAccept: () => void
  onDecline: () => void
  acceptLabel?: string
  prominent?: boolean
}) {
  return (
    <div className={`game-request-banner-actions ${prominent ? 'game-request-banner-actions--prominent' : ''}`}>
      <button
        type="button"
        onClick={onDecline}
        className="game-request-banner-btn game-request-banner-btn--decline"
      >
        拒绝
      </button>
      <button
        type="button"
        onClick={onAccept}
        className="game-request-banner-btn game-request-banner-btn--accept"
      >
        {acceptLabel}
      </button>
    </div>
  )
}

function ActionBanner({
  id,
  icon,
  title,
  detail,
  onAccept,
  onDecline,
  acceptLabel = '同意',
}: {
  id: string
  icon: string
  title: string
  detail?: string
  onAccept: () => void
  onDecline: () => void
  acceptLabel?: string
}) {
  return (
    <div
      key={id}
      className="game-request-banner game-request-banner--action"
      role="alert"
      aria-live="assertive"
    >
      <div className="game-request-banner-head">
        <span className="game-request-banner-icon" aria-hidden>
          {icon}
        </span>
        <div className="game-request-banner-copy">
          <p className="game-request-banner-title">{title}</p>
          {detail && <p className="game-request-banner-detail">{detail}</p>}
        </div>
      </div>
      <RequestActions
        prominent
        onAccept={onAccept}
        onDecline={onDecline}
        acceptLabel={acceptLabel}
      />
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
      <ActionBanner
        key="undo-req"
        id="undo-req"
        icon="↩"
        title="对方请求悔棋"
        detail="是否同意撤销上一步？"
        onAccept={onAcceptUndo}
        onDecline={onDeclineUndo}
      />,
    )
  }

  if (pendingOpponentRestartRequest && onAcceptRestart && onDeclineRestart) {
    const who = restartFromColor === 'white' ? '白方' : restartFromColor === 'black' ? '黑方' : '对方'
    banners.push(
      <ActionBanner
        key="restart-req"
        id="restart-req"
        icon="↻"
        title={`${who} 请求重新开始`}
        detail="是否同意重开一局？"
        onAccept={onAcceptRestart}
        onDecline={onDeclineRestart}
      />,
    )
  }

  if (pendingOpponentPauseRequest && onAcceptPause && onDeclinePause) {
    banners.push(
      <ActionBanner
        key="pause-req"
        id="pause-req"
        icon="⏸"
        title="对方请求暂停"
        detail="同意前，对方棋钟仍会继续倒计时。"
        onAccept={onAcceptPause}
        onDecline={onDeclinePause}
      />,
    )
  }

  if (pendingOpponentResumeRequest && onAcceptResume && onDeclineResume) {
    banners.push(
      <ActionBanner
        key="resume-req"
        id="resume-req"
        icon="▶"
        title="对方请求恢复对局"
        detail="是否同意继续下棋？"
        onAccept={onAcceptResume}
        onDecline={onDeclineResume}
      />,
    )
  }

  if (pendingMyUndoRequest) {
    banners.push(
      <div key="undo-wait" className="game-request-banner game-request-banner--waiting">
        <div className="game-request-banner-head">
          <span className="game-request-banner-icon game-request-banner-icon--muted" aria-hidden>
            ↩
          </span>
          <p className="game-request-banner-title">悔棋请求中… 等待对方回应</p>
        </div>
      </div>,
    )
  }

  if (pendingMyRestartRequest) {
    banners.push(
      <div key="restart-wait" className="game-request-banner game-request-banner--waiting">
        <div className="game-request-banner-head">
          <span className="game-request-banner-icon game-request-banner-icon--muted" aria-hidden>
            ↻
          </span>
          <p className="game-request-banner-title">重开请求中… 等待对方回应</p>
        </div>
      </div>,
    )
  }

  if (pendingMyPauseRequest) {
    banners.push(
      <div key="pause-wait" className="game-request-banner game-request-banner--waiting">
        <div className="game-request-banner-head">
          <span className="game-request-banner-icon game-request-banner-icon--muted" aria-hidden>
            ⏸
          </span>
          <div className="game-request-banner-copy">
            <p className="game-request-banner-title">暂停请求中… 等待对方回应</p>
            <p className="game-request-banner-detail">对方同意前，你的棋钟仍会继续倒计时。</p>
          </div>
        </div>
      </div>,
    )
  }

  if (pendingMyResumeRequest) {
    banners.push(
      <div key="resume-wait" className="game-request-banner game-request-banner--waiting">
        <div className="game-request-banner-head">
          <span className="game-request-banner-icon game-request-banner-icon--muted" aria-hidden>
            ▶
          </span>
          <p className="game-request-banner-title">恢复请求中… 等待对方回应</p>
        </div>
      </div>,
    )
  }

  if (clockPaused) {
    banners.push(
      <div key="paused" className="game-request-banner game-request-banner--paused">
        <div className="game-request-banner-head">
          <span className="game-request-banner-icon game-request-banner-icon--muted" aria-hidden>
            ⏸
          </span>
          <div className="game-request-banner-copy">
            <p className="game-request-banner-title">对局已暂停</p>
            <p className="game-request-banner-detail">棋盘仍可查看，暂不可走棋。点击「请求恢复」继续。</p>
          </div>
        </div>
      </div>,
    )
  }

  if (banners.length === 0) return null

  return <div className="game-board-alerts game-request-banner-stack">{banners}</div>
}
