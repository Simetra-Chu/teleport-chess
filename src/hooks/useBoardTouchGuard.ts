import { useEffect, type RefObject } from 'react'

/**
 * 在棋盘区域拦截 touchmove，防止拖拽棋子时页面跟着滚动。
 * 需配合 CSS touch-action: none 使用。
 */
export function useBoardTouchGuard(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const blockScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }

    el.addEventListener('touchmove', blockScroll, { passive: false })

    return () => {
      el.removeEventListener('touchmove', blockScroll)
    }
  }, [ref, enabled])
}
