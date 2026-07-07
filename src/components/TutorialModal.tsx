interface TutorialModalProps {
  open: boolean
  onClose: () => void
}

export default function TutorialModal({ open, onClose }: TutorialModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-amber-500/20 bg-[#12121c] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="tutorial-title"
      >
        <div className="sticky top-0 border-b border-white/10 bg-[#12121c]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <h2 id="tutorial-title" className="text-lg font-bold text-amber-400">
              玩法教程
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 min-w-11 rounded-lg border border-white/10 px-3 py-1 text-sm text-white/60 hover:bg-white/5"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5 text-sm text-white/75">
          {/* 国际象棋基础 */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-white/90">一、国际象棋基础</h3>
            <ul className="space-y-1.5 text-xs leading-relaxed text-white/60">
              <li>· 白方先行，双方轮流走棋，一次走一格（按棋子规则）。</li>
              <li>· <strong className="text-white/80">将军</strong>：王被攻击；必须下一手解将，否则违规。</li>
              <li>· <strong className="text-red-300/90">将死</strong>：被将军且无任何合法应法 → 输棋。</li>
              <li>· <strong className="text-sky-300/90">逼和</strong>：未被将军但无合法走法 → 和棋。</li>
              <li>· 王<strong className="text-white/80">不能被吃掉</strong>，只能通过将死取胜。</li>
            </ul>
            <div className="mt-3 overflow-hidden rounded-lg border border-white/8 text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-white/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">棋子</th>
                    <th className="px-3 py-2 font-medium">走法</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/65">
                  <tr><td className="px-3 py-1.5">兵</td><td className="px-3 py-1.5">直走1格，首步可2格；斜向吃子；到底升变</td></tr>
                  <tr><td className="px-3 py-1.5">车</td><td className="px-3 py-1.5">横竖直线任意格</td></tr>
                  <tr><td className="px-3 py-1.5">象</td><td className="px-3 py-1.5">斜线任意格</td></tr>
                  <tr><td className="px-3 py-1.5">后</td><td className="px-3 py-1.5">车 + 象</td></tr>
                  <tr><td className="px-3 py-1.5">马</td><td className="px-3 py-1.5">日字跳，可越子</td></tr>
                  <tr><td className="px-3 py-1.5">王</td><td className="px-3 py-1.5">周围8格；可与车易位</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-white/45">本游戏支持过路兵、王车易位；兵升变时可自选后/车/象/马。</p>
          </section>

          {/* 瞬移 - 重点 */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4">
            <h3 className="mb-2 text-sm font-bold text-amber-300">二、激活瞬移模式（必看）</h3>
            <p className="mb-2 text-xs leading-relaxed text-white/70">
              <strong className="text-amber-200">【核心关键】</strong>
              在瞬移前，请先点击对局中的
              <strong className="text-white/90">「开启瞬移」</strong>
              按钮。按钮会变为紫色高亮的
              <strong className="text-purple-300">「瞬移模式 ON」</strong>
              ，才能进行瞬移！
            </p>
            <p className="text-xs text-white/45">
              对局中点 📖 可打开互动教程，高亮引导你点击该按钮。
            </p>
          </section>

          <section className="rounded-xl border border-purple-500/25 bg-purple-950/20 p-4">
            <h3 className="mb-2 text-sm font-bold text-purple-300">三、瞬移走法（本游戏核心）</h3>
            <p className="mb-3 text-xs leading-relaxed text-white/65">
              瞬移让棋子<strong className="text-white/85">无视常规走法</strong>，直接跳到另一格（受规则限制）。
              每用一次消耗 1 次瞬移机会，然后换手。
            </p>
            <ol className="mb-3 list-inside list-decimal space-y-1 text-xs text-white/70">
              <li>
                先点 <span className="text-amber-300">「开启瞬移」</span> 激活模式
              </li>
              <li>
                确认按钮变为紫色高亮 <span className="text-purple-300">「瞬移模式 ON」</span>
              </li>
              <li>点己方子（金色）→ 点<strong className="text-purple-300">紫色高亮格</strong></li>
            </ol>
            <p className="text-xs text-amber-400/80">硬性限制：瞬移后己方不能处于被将军；永远不能移动到王上（含吃王）。</p>
          </section>

          {/* 瞬移规则配置 */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-white/90">四、瞬移规则（房主可配）</h3>
            <dl className="space-y-2 text-xs">
              <RuleRow term="瞬移次数" def="每方整局可用几次，用完只能常规走棋。" />
              <RuleRow term="任意棋子" def="关 = 仅皇后可瞬移。" />
              <RuleRow term="禁止吃子" def="开 = 只能跳到空格；关 = 可吃子（不能吃王）。" />
              <RuleRow term="禁止吃己方" def="在允许吃子时，能否覆盖己方子。" />
              <RuleRow term="禁止将军" def="开 = 瞬移后不能直接将军对方。" />
              <RuleRow term="兵禁升变" def="开 = 瞬移过的兵到底线不能升变。" />
            </dl>
          </section>

          {/* 操作提示 */}
          <section className="border-t border-white/8 pt-4 text-xs text-white/45">
            <p>
              <strong className="text-white/60">普通走棋（默认）</strong>：不点「开启瞬移」时，拖拽或点击己方子 → 目标格。
            </p>
            <p className="mt-1">
              <strong className="text-white/60">瞬移走棋</strong>：先点
              <strong className="text-amber-300/90">「开启瞬移」</strong>
              → 按钮变为「瞬移模式 ON」→ 点己方子 → 点紫色格。
            </p>
            <p className="mt-1">联机：房主创建房间为白方，好友加入为黑方。</p>
          </section>
        </div>
      </div>
    </div>
  )
}

function RuleRow({ term, def }: { term: string; def: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
      <dt className="w-20 shrink-0 font-medium text-amber-400/90">{term}</dt>
      <dd className="text-white/55">{def}</dd>
    </div>
  )
}
