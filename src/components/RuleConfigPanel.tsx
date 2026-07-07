import type { TeleportConfig } from '../chessEngine'

interface RuleConfigPanelProps {
  config: TeleportConfig
  onChange: (partial: Partial<TeleportConfig>) => void
  disabled?: boolean
  readOnly?: boolean
  title?: string
  hint?: string
}

export default function RuleConfigPanel({
  config,
  onChange,
  disabled = false,
  readOnly = false,
  title = '瞬移规则配置',
  hint = '创建房间时将以上规则发送给对手',
}: RuleConfigPanelProps) {
  const locked = disabled || readOnly

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161622]/80 p-5">
      <h3 className="text-sm font-bold text-amber-400">{title}</h3>
      <p className="mt-1 text-xs text-white/45">{hint}</p>

      <div className="mt-4 space-y-4">
        <Field label="每方瞬移次数">
          <input
            type="number"
            min={0}
            max={20}
            disabled={locked}
            value={config.each_side_tp_times}
            onChange={(e) => onChange({ each_side_tp_times: Number(e.target.value) })}
            className="rule-number-input w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-left text-base outline-none focus:border-amber-500/60 disabled:opacity-50"
          />
        </Field>

        <Toggle
          label="任意棋子可瞬移"
          hint="关闭后仅皇后可瞬移"
          checked={config.tp_any_piece}
          disabled={locked}
          onChange={(v) => onChange({ tp_any_piece: v })}
        />
        <Toggle
          label="禁止瞬移吃子"
          hint="开启后落点必须为空格"
          checked={config.tp_cannot_capture}
          disabled={locked}
          onChange={(v) => onChange({ tp_cannot_capture: v })}
        />
        <Toggle
          label="禁止瞬移吃己方子"
          hint={config.tp_cannot_capture ? '需先关闭「禁止瞬移吃子」' : '关闭后可覆盖己方棋子'}
          checked={config.tp_cannot_capture_own}
          disabled={locked || config.tp_cannot_capture}
          onChange={(v) => onChange({ tp_cannot_capture_own: v })}
        />
        <Toggle
          label="禁止瞬移将军"
          checked={config.tp_cannot_check}
          disabled={locked}
          onChange={(v) => onChange({ tp_cannot_check: v })}
        />
        <Toggle
          label="瞬移过的兵禁止升变"
          checked={config.pawn_tp_no_promote}
          disabled={locked}
          onChange={(v) => onChange({ pawn_tp_no_promote: v })}
        />

        {!readOnly && (
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              onChange({
                each_side_tp_times: 1,
                tp_any_piece: true,
                tp_cannot_capture: true,
                tp_cannot_capture_own: true,
                tp_cannot_check: true,
                pawn_tp_no_promote: true,
              })
            }
            className="w-full rounded-xl border border-white/10 py-2.5 text-left text-xs text-white/60 transition hover:bg-white/5 disabled:opacity-40"
          >
            恢复默认规则
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-left">
      <span className="text-sm font-medium text-white/80">{label}</span>
      {children}
    </label>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg py-1 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <div>
        <span className="block text-sm text-white/85">{label}</span>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-amber-500' : 'bg-white/20'} disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </label>
  )
}
