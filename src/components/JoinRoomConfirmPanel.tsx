import type { TeleportConfig } from '../chessEngine'
import type { JoinRoomPreview } from '../multiplayer/types'
import RuleConfigPanel from './RuleConfigPanel'

interface JoinRoomConfirmPanelProps {
  preview: JoinRoomPreview
  loading: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function JoinRoomConfirmPanel({
  preview,
  loading,
  error,
  onConfirm,
  onCancel,
}: JoinRoomConfirmPanelProps) {
  const { roomCode, config, timePerSideMinutes, status } = preview

  return (
    <div className="lobby-page">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-purple-500/25 bg-[#12121c] shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 px-6 py-6 text-center sm:px-8">
            <p className="text-xs uppercase tracking-widest text-white/40">确认加入房间</p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-purple-400">
              {roomCode}
            </p>
            <p className="mt-3 text-sm text-white/60">
              你将执<strong className="text-white/85">黑方</strong>加入对局
            </p>
          </div>

          <div className="space-y-4 px-5 py-6 sm:px-8">
            <div className="rounded-xl border border-sky-500/25 bg-sky-950/20 px-4 py-3 text-sm">
              <p className="text-sky-200/90">
                包干制 · 每方 <strong>{timePerSideMinutes}</strong> 分钟
              </p>
              <p className="mt-1 text-xs text-white/45">
                {status === 'waiting' ? '房主已就绪，等待加入' : '对局进行中（请确认规则后加入）'}
              </p>
            </div>

            <RuleConfigPanel
              config={config}
              onChange={() => {}}
              readOnly
              title="房主设定的规则"
              hint="请确认以下瞬移规则后再加入，加入后不可修改"
            />

            <RuleSummary config={config} />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="min-h-11 flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-50"
              >
                返回
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="min-h-11 flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '加入中…' : '确认加入'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RuleSummary({ config }: { config: TeleportConfig }) {
  const items = [
    `每方瞬移 ${config.each_side_tp_times} 次`,
    config.tp_any_piece ? '任意棋子可瞬移' : '仅皇后可瞬移',
    config.tp_cannot_capture ? '禁止瞬移吃子' : '允许瞬移吃子',
    config.tp_cannot_check ? '禁止瞬移将军' : '允许瞬移将军',
    config.pawn_tp_no_promote ? '瞬移过的兵禁止升变' : '瞬移过的兵可升变',
  ]

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 px-4 py-3">
      <p className="text-xs font-medium text-amber-300/90">规则摘要</p>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-white/60">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  )
}
