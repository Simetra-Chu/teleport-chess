/** 格式化棋钟秒数为 MM:SS */
export function formatClockTime(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 解析自定义时长（分钟），有效范围 1–60 */
export function parseTimeMinutes(raw: string | number, fallback = 10): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : raw
  if (!Number.isFinite(n) || n < 1 || n > 60) return fallback
  return Math.floor(n)
}

export const TIME_PRESETS = [5, 10, 20] as const
export type TimePreset = (typeof TIME_PRESETS)[number] | 'custom'

export const DEFAULT_TIME_MINUTES = 10
