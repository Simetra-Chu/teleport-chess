import type { TeleportConfig } from '../chessEngine'
import RuleConfigPanel from './RuleConfigPanel'
import TutorialButton from './TutorialButton'

interface LobbyPanelProps {
  joinInput: string
  loading: boolean
  config: TeleportConfig
  onConfigChange: (partial: Partial<TeleportConfig>) => void
  onJoinInputChange: (v: string) => void
  onCreateRoom: () => void
  onJoinRoom: () => void
  onOpenTutorial: () => void
  error: string | null
}

export default function LobbyPanel({
  joinInput,
  loading,
  config,
  onConfigChange,
  onJoinInputChange,
  onCreateRoom,
  onJoinRoom,
  onOpenTutorial,
  error,
}: LobbyPanelProps) {
  return (
    <div className="lobby-page">
      <div className="lobby-layout">
        {/* 手机：上方创建/加入；桌面：左侧 */}
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#12121c] shadow-2xl shadow-black/50">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />

          <div className="relative border-b border-white/10 px-5 py-6 text-center sm:px-8 sm:py-7">
            <p className="text-3xl sm:text-4xl">♞</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-2xl">
              瞬移国际象棋 · 联机对战
            </h2>
            <p className="mt-2 text-sm text-white/45">创建房间邀请好友，或输入房间号加入对局</p>
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
              <p className="mt-1 text-xs text-white/45">输入好友分享的 4 位数字房间号（加入后为黑方）</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="例如 4829"
                  value={joinInput}
                  onChange={(e) => onJoinInputChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-purple-500/50"
                />
                <button
                  type="button"
                  disabled={loading || joinInput.length !== 4}
                  onClick={onJoinRoom}
                  className="min-h-11 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  加入
                </button>
              </div>
            </section>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* 手机：下方规则；桌面：右侧 */}
        <div className="w-full max-w-lg lg:max-w-sm lg:sticky lg:top-24">
          <RuleConfigPanel
            config={config}
            onChange={onConfigChange}
            disabled={loading}
            title="房主规则设置"
            hint="创建房间时将以上规则同步给对手"
          />
        </div>
      </div>
    </div>
  )
}
