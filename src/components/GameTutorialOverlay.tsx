import { useCallback, useEffect, useState } from 'react'

type TutorialStep = 'activate-mode' | 'how-teleport' | 'done'

interface GameTutorialOverlayProps {
  open: boolean
  teleportMode: boolean
  onClose: () => void
}

export default function GameTutorialOverlay({
  open,
  teleportMode,
  onClose,
}: GameTutorialOverlayProps) {
  const [step, setStep] = useState<TutorialStep>('activate-mode')
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const measureTarget = useCallback(() => {
    const el = document.getElementById('teleport-mode-toggle')
    if (el) setTargetRect(el.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!open) {
      setStep('activate-mode')
      return
    }
    measureTarget()
    const t = window.setTimeout(measureTarget, 80)
    window.addEventListener('resize', measureTarget)
    window.addEventListener('scroll', measureTarget, true)
    const el = document.getElementById('teleport-mode-toggle')
    const ro = el ? new ResizeObserver(measureTarget) : null
    if (el && ro) ro.observe(el)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', measureTarget)
      window.removeEventListener('scroll', measureTarget, true)
      ro?.disconnect()
    }
  }, [open, measureTarget, step])

  useEffect(() => {
    if (!open || step !== 'activate-mode') return
    if (teleportMode) setStep('how-teleport')
  }, [open, step, teleportMode])

  if (!open || !targetRect) return null

  const pad = 10
  const spotTop = targetRect.top - pad
  const spotLeft = targetRect.left - pad
  const spotW = targetRect.width + pad * 2
  const spotH = targetRect.height + pad * 2

  const tooltipTop = Math.min(spotTop + spotH + 14, window.innerHeight - 220)
  const tooltipLeft = Math.max(12, Math.min(spotLeft, window.innerWidth - 320))

  return (
    <div className="game-tutorial-overlay" role="dialog" aria-modal="true" aria-label="互动新手教程">
      <div
        className="game-tutorial-spotlight"
        style={{
          top: spotTop,
          left: spotLeft,
          width: spotW,
          height: spotH,
        }}
      />

      <div
        className="game-tutorial-tooltip"
        style={{ top: tooltipTop, left: tooltipLeft, maxWidth: Math.min(304, window.innerWidth - 24) }}
      >
        {step === 'activate-mode' && (
          <>
            <p className="game-tutorial-step">步骤 1 / 2</p>
            <h3 className="game-tutorial-title">【核心关键】先激活瞬移模式</h3>
            <p className="game-tutorial-body">
              在瞬移前，请先点击高亮处的
              <strong>「开启瞬移」</strong>
              按钮，以激活特殊对弈模式！
            </p>
            <p className="game-tutorial-hint">👆 点击上方发光按钮继续教程</p>
          </>
        )}

        {step === 'how-teleport' && (
          <>
            <p className="game-tutorial-step">步骤 2 / 2</p>
            <h3 className="game-tutorial-title">瞬移已激活！</h3>
            <p className="game-tutorial-body">
              激活成功后，按钮会变为紫色高亮的
              <strong>「瞬移模式 ON」</strong>。接着：
            </p>
            <ol className="game-tutorial-list">
              <li>点击己方棋子（格子变金色）</li>
              <li>再点<strong>紫色高亮格</strong>完成瞬移</li>
            </ol>
            <button type="button" className="game-tutorial-next" onClick={() => setStep('done')}>
              我明白了
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            <h3 className="game-tutorial-title">教程完成</h3>
            <p className="game-tutorial-body">随时可点右下角 📖 或顶部按钮查看完整规则。</p>
            <button type="button" className="game-tutorial-next" onClick={onClose}>
              开始对战
            </button>
          </>
        )}

        {step !== 'done' && (
          <button type="button" className="game-tutorial-skip" onClick={onClose}>
            跳过教程
          </button>
        )}
      </div>
    </div>
  )
}
