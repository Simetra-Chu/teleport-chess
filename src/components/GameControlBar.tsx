interface GameControlBarProps {
  disabled: boolean
  canRequestUndo: boolean
  pendingMyUndoRequest: boolean
  pendingMyRestartRequest: boolean
  clockPaused: boolean
  pendingMyPauseRequest: boolean
  pendingMyResumeRequest: boolean
  onResign: () => void
  onRequestUndo: () => void
  onRequestRestart: () => void
  onRequestPause: () => void
  onRequestResume: () => void
}

export default function GameControlBar({
  disabled,
  canRequestUndo,
  pendingMyUndoRequest,
  pendingMyRestartRequest,
  clockPaused,
  pendingMyPauseRequest,
  pendingMyResumeRequest,
  onResign,
  onRequestUndo,
  onRequestRestart,
  onRequestPause,
  onRequestResume,
}: GameControlBarProps) {
  const undoDisabled =
    disabled ||
    !canRequestUndo ||
    pendingMyUndoRequest ||
    pendingMyRestartRequest ||
    pendingMyPauseRequest ||
    pendingMyResumeRequest

  const busy =
    pendingMyUndoRequest ||
    pendingMyRestartRequest ||
    pendingMyPauseRequest ||
    pendingMyResumeRequest

  return (
    <div className="game-control-bar">
      <button
        type="button"
        disabled={disabled}
        onClick={onResign}
        className="game-control-btn game-control-btn--resign"
      >
        认输
      </button>
      <button
        type="button"
        disabled={undoDisabled}
        onClick={onRequestUndo}
        className="game-control-btn game-control-btn--undo"
        title={canRequestUndo ? '向对手请求撤销上一手' : '你只能在自己走完棋后请求悔棋'}
      >
        {pendingMyUndoRequest ? '悔棋请求中…' : '悔棋'}
      </button>
      {!clockPaused ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={onRequestPause}
          className="game-control-btn game-control-btn--pause"
        >
          {pendingMyPauseRequest ? '暂停请求中…' : '请求暂停'}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={onRequestResume}
          className="game-control-btn game-control-btn--pause"
        >
          {pendingMyResumeRequest ? '恢复请求中…' : '请求恢复'}
        </button>
      )}
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onRequestRestart}
        className="game-control-btn game-control-btn--restart"
      >
        {pendingMyRestartRequest ? '重开请求中…' : '请求重开'}
      </button>
    </div>
  )
}
