import type { PromoPiece } from '../gameStatus'

const OPTIONS: { piece: PromoPiece; white: string; black: string; label: string }[] = [
  { piece: 'Q', white: '♕', black: '♛', label: '后' },
  { piece: 'R', white: '♖', black: '♜', label: '车' },
  { piece: 'B', white: '♗', black: '♝', label: '象' },
  { piece: 'N', white: '♘', black: '♞', label: '马' },
]

interface PromotionDialogProps {
  isWhite: boolean
  onSelect: (piece: PromoPiece) => void
  onCancel: () => void
}

export default function PromotionDialog({ isWhite, onSelect, onCancel }: PromotionDialogProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[10px] bg-black/65 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xs rounded-2xl border border-amber-500/30 bg-[#161622] p-5 shadow-2xl">
        <h3 className="text-center text-lg font-bold text-amber-400">兵升变</h3>
        <p className="mt-1 text-center text-xs text-white/50">请选择要升变的棋子</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {OPTIONS.map(({ piece, white, black, label }) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              className="flex min-h-14 flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 py-3 transition active:scale-[0.98] hover:border-amber-500/60 hover:bg-amber-500/15"
            >
              <span className="text-3xl leading-none">{isWhite ? white : black}</span>
              <span className="text-xs text-white/70">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm text-white/60 transition hover:bg-white/5"
        >
          取消
        </button>
      </div>
    </div>
  )
}
