import { formatClockTime } from '../utils/clockFormat'
import type { PlayerColor } from '../multiplayer/types'

interface ChessClockDisplayProps {
  whiteTime: number
  blackTime: number
  activeColor: PlayerColor | null
  paused: boolean
  playerColor: PlayerColor | null
}

function ClockRow({
  label,
  seconds,
  active,
  low,
  isSelf,
}: {
  label: string
  seconds: number
  active: boolean
  low: boolean
  isSelf: boolean
}) {
  return (
    <div
      className={`chess-clock-row flex items-center justify-between rounded-xl border px-4 py-3 transition ${
        active && !low
          ? 'chess-clock-row--active border-amber-400/50 bg-amber-500/10'
          : active && low
            ? 'chess-clock-row--active chess-clock-row--low border-red-500/50 bg-red-950/30'
            : 'border-white/10 bg-black/25'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[11px] text-white/45">{label}</p>
        {isSelf && <p className="text-[10px] text-amber-400/80">你</p>}
      </div>
      <p
        className={`font-mono text-2xl font-bold tabular-nums tracking-wide sm:text-3xl ${
          low ? 'text-red-400' : active ? 'text-amber-300' : 'text-white/85'
        } ${active ? 'chess-clock-digit--pulse' : ''}`}
      >
        {formatClockTime(seconds)}
      </p>
    </div>
  )
}

export default function ChessClockDisplay({
  whiteTime,
  blackTime,
  activeColor,
  paused,
  playerColor,
}: ChessClockDisplayProps) {
  const whiteActive = !paused && activeColor === 'white'
  const blackActive = !paused && activeColor === 'black'

  return (
    <div className="chess-clock-display space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-white/50">棋钟</p>
        {paused && (
          <span className="rounded-full border border-orange-500/40 bg-orange-950/40 px-2 py-0.5 text-[10px] text-orange-300">
            已暂停
          </span>
        )}
      </div>
      <ClockRow
        label="白方"
        seconds={whiteTime}
        active={whiteActive}
        low={whiteTime < 60}
        isSelf={playerColor === 'white'}
      />
      <ClockRow
        label="黑方"
        seconds={blackTime}
        active={blackActive}
        low={blackTime < 60}
        isSelf={playerColor === 'black'}
      />
    </div>
  )
}
