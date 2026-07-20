interface PauseResumeRequestDialogProps {
  kind: 'pause' | 'resume'
  onAccept: () => void
  onReject: () => void
}

export default function PauseResumeRequestDialog({
  kind,
  onAccept,
  onReject,
}: PauseResumeRequestDialogProps) {
  const title = kind === 'pause' ? '暂停请求' : '恢复请求'
  const body =
    kind === 'pause' ? '对方请求暂停，是否同意？' : '对方请求恢复对局，是否同意？'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border border-sky-500/30 bg-[#161622] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-sky-400">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
        {kind === 'pause' && (
          <p className="mt-2 text-xs text-amber-300/80">
            在你同意之前，对方棋钟仍会继续倒计时。
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onReject}
            className="min-h-11 flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-white/70 hover:bg-white/5"
          >
            拒绝
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="min-h-11 flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  )
}
