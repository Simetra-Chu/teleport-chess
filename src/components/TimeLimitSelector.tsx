import { DEFAULT_TIME_MINUTES, parseTimeMinutes, TIME_PRESETS, type TimePreset } from '../utils/clockFormat'

interface TimeLimitSelectorProps {
  preset: TimePreset
  customMinutes: string
  disabled?: boolean
  onPresetChange: (preset: TimePreset) => void
  onCustomMinutesChange: (v: string) => void
}

export default function TimeLimitSelector({
  preset,
  customMinutes,
  disabled,
  onPresetChange,
  onCustomMinutesChange,
}: TimeLimitSelectorProps) {
  return (
    <section className="time-limit-selector rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5">
      <h3 className="text-sm font-semibold text-sky-300">每方用时（包干制）</h3>
      <p className="mt-1 text-xs text-white/45">仅扣除当前回合方时间，用完即判负</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIME_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onPresetChange(m)}
            className={`time-preset-btn min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition ${
              preset === m
                ? 'bg-sky-600 text-white'
                : 'border border-white/10 bg-black/30 text-white/70 hover:bg-white/5'
            }`}
          >
            {m} 分钟
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPresetChange('custom')}
          className={`time-preset-btn min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition ${
            preset === 'custom'
              ? 'bg-sky-600 text-white'
              : 'border border-white/10 bg-black/30 text-white/70 hover:bg-white/5'
          }`}
        >
          自定义时长
        </button>
      </div>
      {preset === 'custom' && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={60}
            inputMode="numeric"
            disabled={disabled}
            value={customMinutes}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2)
              onCustomMinutesChange(v)
            }}
            className="w-20 min-h-10 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-center text-sm outline-none focus:border-sky-500/50"
          />
          <span className="text-sm text-white/50">分钟（1–60）</span>
        </div>
      )}
      <p className="mt-3 text-xs text-white/40">
        当前设定：每方{' '}
        <strong className="text-sky-300/90">
          {preset === 'custom' ? parseTimeMinutes(customMinutes, DEFAULT_TIME_MINUTES) : preset}
          分钟
        </strong>
      </p>
    </section>
  )
}
