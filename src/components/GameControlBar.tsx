interface GameControlBarProps {
  disabled: boolean
  canRequestUndo: boolean
  pendingMyUndoRequest: boolean
  pendingMyRestartRequest: boolean
  onResign: () => void
  onRequestUndo: () => void
  onRequestRestart: () => void
}

export default function GameControlBar({
  disabled,
  canRequestUndo,
  pendingMyUndoRequest,
  pendingMyRestartRequest,
  onResign,
  onRequestUndo,
  onRequestRestart,
}: GameControlBarProps) {
  const undoDisabled = disabled || !canRequestUndo || pendingMyUndoRequest || pendingMyRestartRequest

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
      <button
        type="button"
        disabled={disabled || pendingMyUndoRequest || pendingMyRestartRequest}
        onClick={onRequestRestart}
        className="game-control-btn game-control-btn--restart"
      >
        {pendingMyRestartRequest ? '重开请求中…' : '请求重开'}
      </button>
    </div>
  )
}
