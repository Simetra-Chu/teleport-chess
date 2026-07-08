interface GameControlBarProps {
  disabled: boolean
  canUndo: boolean
  pendingMyRequest: 'undo' | 'restart' | null
  onResign: () => void
  onRequestUndo: () => void
  onRequestRestart: () => void
}

export default function GameControlBar({
  disabled,
  canUndo,
  pendingMyRequest,
  onResign,
  onRequestUndo,
  onRequestRestart,
}: GameControlBarProps) {
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
        disabled={disabled || !canUndo || !!pendingMyRequest}
        onClick={onRequestUndo}
        className="game-control-btn game-control-btn--undo"
        title={canUndo ? '向对手请求撤销上一手' : '尚无可以悔棋的步数'}
      >
        {pendingMyRequest === 'undo' ? '悔棋请求中…' : '请求悔棋'}
      </button>
      <button
        type="button"
        disabled={disabled || !!pendingMyRequest}
        onClick={onRequestRestart}
        className="game-control-btn game-control-btn--restart"
      >
        {pendingMyRequest === 'restart' ? '重开请求中…' : '请求重开'}
      </button>
    </div>
  )
}
