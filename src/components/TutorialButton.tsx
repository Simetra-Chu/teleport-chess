interface TutorialButtonProps {
  onClick: () => void
  variant?: 'header' | 'hero' | 'float'
}

export default function TutorialButton({ onClick, variant = 'header' }: TutorialButtonProps) {
  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-purple-600/20 px-5 py-4 text-left transition hover:border-amber-400/60 hover:from-amber-600/30"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-2xl ring-1 ring-amber-400/30">
            📖
          </span>
          <div>
            <p className="font-semibold text-amber-300 group-hover:text-amber-200">玩法教程 · 新手必看</p>
            <p className="mt-0.5 text-xs text-white/45">国际象棋基础 + 瞬移规则说明</p>
          </div>
          <span className="ml-auto text-amber-400/60 transition group-hover:translate-x-0.5">→</span>
        </div>
      </button>
    )
  }

  if (variant === 'float') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="玩法教程"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-xl shadow-lg shadow-amber-900/40 ring-2 ring-amber-300/30 transition hover:scale-105 hover:shadow-amber-800/50"
      >
        📖
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-400"
    >
      📖 玩法教程
    </button>
  )
}
