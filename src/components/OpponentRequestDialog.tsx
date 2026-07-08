import type { PlayerColor } from '../multiplayer/types'

export type OpponentRequestType = 'undo' | 'restart'

export interface OpponentRequestDialogProps {
  type: OpponentRequestType
  fromColor: PlayerColor
  onAccept: () => void
  onReject: () => void
}

export default function OpponentRequestDialog({
  type,
  fromColor,
  onAccept,
  onReject,
}: OpponentRequestDialogProps) {
  const who = fromColor === 'white' ? '白方' : '黑方'
  const title = type === 'undo' ? '悔棋请求' : '重开请求'
  const body =
    type === 'undo'
      ? `${who} 请求撤销上一手棋，是否同意？`
      : `${who} 请求重新开始一局，是否同意？`

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#161622] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-amber-400">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
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
            className="min-h-11 flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  )
}
