import type { TeleportConfig } from '../chessEngine'
import type { AiDifficulty } from '../ai/types'
import { AI_DIFFICULTY_LABELS } from '../ai/types'
import type { PlayerColor } from '../multiplayer/types'
import RuleConfigPanel from './RuleConfigPanel'
import TutorialButton from './TutorialButton'
import TimeLimitSelector from './TimeLimitSelector'
import type { TimePreset } from '../utils/clockFormat'

export type LobbyMode = 'online' | 'pve'

interface LobbyPanelProps {
  lobbyMode: LobbyMode
  onLobbyModeChange: (mode: LobbyMode) => void
  joinInput: string
  loading: boolean
  config: TeleportConfig
  onConfigChange: (partial: Partial<TeleportConfig>) => void
  timePreset: TimePreset
  customMinutes: string
  onTimePresetChange: (v: TimePreset) => void
  onCustomMinutesChange: (v: string) => void
  onJoinInputChange: (v: string) => void
  onCreateRoom: () => void
  onJoinRoom: () => void
  onOpenTutorial: () => void
  error: string | null
  pveDifficulty: AiDifficulty
  onPveDifficultyChange: (d: AiDifficulty) => void
  pveColor: PlayerColor
  onPveColorChange: (c: PlayerColor) => void
  onStartPvE: () => void
  pveConfig: TeleportConfig
  onPveConfigChange: (partial: Partial<TeleportConfig>) => void
}

export default function LobbyPanel({
  lobbyMode,
  onLobbyModeChange,
  joinInput,
  loading,
  config,
  onConfigChange,
  timePreset,
  customMinutes,
  onTimePresetChange,
  onCustomMinutesChange,
  onJoinInputChange,
  onCreateRoom,
  onJoinRoom,
  onOpenTutorial,
  error,
  pveDifficulty,
  onPveDifficultyChange,
  pveColor,
  onPveColorChange,
  onStartPvE,
  pveConfig,
  onPveConfigChange,
}: LobbyPanelProps) {
  const difficulties: AiDifficulty[] = ['easy', 'medium', 'hard']

  return (
    <div className="lobby-page">
      <div className="lobby-mode-banner mx-auto mb-6 w-full max-w-lg">
        <p className="mb-3 text-center text-sm font-bold tracking-wide text-amber-300">
          选择游戏模式
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onLobbyModeChange('online')}
            className={`min-h-[5.5rem] rounded-2xl border-2 px-4 py-4 text-left transition ${
              lobbyMode === 'online'
                ? 'border-purple-400 bg-purple-600/25 shadow-lg shadow-purple-900/40 ring-2 ring-purple-400/50'
                : 'border-white/15 bg-black/35 hover:border-white/30 hover:bg-black/45'
            }`}
          >
            <span className="text-2xl">🌐</span>
            <p className="mt-2 text-base font-bold text-white">在线联机</p>
            <p className="mt-1 text-xs text-white/55">创建或加入房间</p>
          </button>
          <button
            type="button"
            onClick={() => onLobbyModeChange('pve')}
            className={`min-h-[5.5rem] rounded-2xl border-2 px-4 py-4 text-left transition ${
              lobbyMode === 'pve'
                ? 'border-amber-400 bg-amber-600/25 shadow-lg shadow-amber-900/40 ring-2 ring-amber-400/50'
                : 'border-white/15 bg-black/35 hover:border-white/30 hover:bg-black/45'
            }`}
          >
            <span className="text-2xl">🤖</span>
            <p className="mt-2 text-base font-bold text-white">单机人机</p>
            <p className="mt-1 text-xs text-white/55">本地 AI 对战</p>
          </button>
        </div>
      </div>

      <div className="lobby-layout">
        <div className="relative w-full min-w-0 max-w-lg overflow-x-hidden rounded-3xl border border-white/10 bg-[#12121c] shadow-2xl shadow-black/50">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />

          {lobbyMode === 'online' ? (
            <>
          <div className="relative border-b border-white/10 px-5 py-6 text-center sm:px-8 sm:py-7">
            <p className="text-3xl sm:text-4xl">♞</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-2xl">
              瞬移国际象棋 · 联机对战
            </h2>
            <p className="mt-2 text-sm text-white/45">创建房间邀请好友，或输入房间号 / 邀请链接加入对局</p>
          </div>

          <div className="relative space-y-5 px-5 py-6 sm:space-y-6 sm:px-8 sm:py-8">
            <TutorialButton onClick={onOpenTutorial} variant="hero" />

            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400">创建新房间</h3>
              <p className="mt-1 text-xs text-white/45">
                你将作为<strong className="text-white/70">白方（房主）</strong>。请先在
                <strong className="text-white/70">下方/右侧</strong>配置规则，再点击创建
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={onCreateRoom}
                className="mt-4 w-full min-h-11 rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '创建中…' : '创建新房间'}
              </button>
            </section>

            <div className="flex items-center gap-3 text-xs text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              或
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold text-white/85">加入已有房间</h3>
              <p className="mt-1 text-xs text-white/45">
                输入好友分享的 4 位房间号，或直接打开邀请链接（加入后为黑方）
              </p>
              <div className="join-room-row mt-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="例如 4829"
                  value={joinInput}
                  onChange={(e) => onJoinInputChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="join-room-input min-h-11 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-lg tracking-[0.2em] outline-none focus:border-purple-500/50"
                />
                <button
                  type="button"
                  disabled={loading || joinInput.length !== 4}
                  onClick={onJoinRoom}
                  className="join-room-btn min-h-11 shrink-0 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? '查询中…' : '查看规则'}
                </button>
              </div>
            </section>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-300">
                {error}
              </p>
            )}
          </div>
            </>
          ) : (
            <>
          <div className="relative border-b border-white/10 px-5 py-6 text-center sm:px-8 sm:py-7">
            <p className="text-3xl sm:text-4xl">🤖</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-2xl">
              单机人机对战
            </h2>
            <p className="mt-2 text-sm text-white/45">本地运行，AI 会灵活运用瞬移进行攻防</p>
          </div>

          <div className="relative space-y-5 px-5 py-6 sm:space-y-6 sm:px-8 sm:py-8">
            <section className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
              <h3 className="text-sm font-semibold text-sky-300">难度</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onPveDifficultyChange(d)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                      pveDifficulty === d
                        ? 'border-sky-400/60 bg-sky-500/25 text-sky-100'
                        : 'border-white/10 bg-black/20 text-white/55 hover:border-white/20'
                    }`}
                  >
                    {AI_DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold text-white/85">你的阵营</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPveColorChange('white')}
                  className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    pveColor === 'white'
                      ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                      : 'border-white/10 text-white/55'
                  }`}
                >
                  执白（先手）
                </button>
                <button
                  type="button"
                  onClick={() => onPveColorChange('black')}
                  className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    pveColor === 'black'
                      ? 'border-purple-400/50 bg-purple-500/15 text-purple-100'
                      : 'border-white/10 text-white/55'
                  }`}
                >
                  执黑（后手）
                </button>
              </div>
            </section>

            <button
              type="button"
              onClick={onStartPvE}
              className="w-full min-h-12 rounded-xl bg-gradient-to-r from-sky-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:from-sky-500 hover:to-purple-500 active:scale-[0.98]"
            >
              开始人机对局
            </button>
          </div>
            </>
          )}
        </div>

        {/* 手机：下方规则；桌面：右侧 */}
        <div className="w-full max-w-lg lg:max-w-sm lg:sticky lg:top-24 space-y-4">
          {lobbyMode === 'online' ? (
            <>
          <TimeLimitSelector
            preset={timePreset}
            customMinutes={customMinutes}
            disabled={loading}
            onPresetChange={onTimePresetChange}
            onCustomMinutesChange={onCustomMinutesChange}
          />
          <RuleConfigPanel
            config={config}
            onChange={onConfigChange}
            disabled={loading}
            title="房主规则设置"
            hint="创建房间时将以上规则同步给对手"
          />
            </>
          ) : (
          <RuleConfigPanel
            config={pveConfig}
            onChange={onPveConfigChange}
            title="本局规则"
            hint="人机对局在本地运行，可自由调整瞬移规则"
          />
          )}
        </div>
      </div>
    </div>
  )
}
