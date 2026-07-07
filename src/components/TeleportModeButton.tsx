interface TeleportModeButtonProps {
  teleportMode: boolean
  disabled?: boolean
  onToggle: () => void
}

export default function TeleportModeButton({
  teleportMode,
  disabled = false,
  onToggle,
}: TeleportModeButtonProps) {
  return (
    <div className="mode-toggle-wrap">
      {!teleportMode && !disabled && (
        <span className="mode-toggle-badge" aria-hidden>
          点我激活瞬移
        </span>
      )}
      <button
        id="teleport-mode-toggle"
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={teleportMode}
        title={teleportMode ? '当前为瞬移模式，点击关闭并回到普通走棋' : '点击「开启瞬移」激活瞬移模式'}
        className={`mode-toggle-btn ${teleportMode ? 'mode-toggle-btn--on' : 'mode-toggle-btn--off'}`}
      >
        {teleportMode ? (
          <>
            <span className="mode-toggle-icon" aria-hidden>
              ⚡
            </span>
            <span>瞬移模式 ON</span>
          </>
        ) : (
          <>
            <span className="mode-toggle-icon mode-toggle-icon--muted" aria-hidden>
              ♟
            </span>
            <span>开启瞬移</span>
          </>
        )}
      </button>
    </div>
  )
}
