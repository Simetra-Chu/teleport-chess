import { useEffect, useState, type RefObject } from 'react'

/** 监听容器宽度，供需要精确像素的场景使用（棋盘默认用 CSS 100% 缩放） */
export function useContainerWidth(ref: RefObject<HTMLElement | null>, fallback = 320) {
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width))
    })
    ro.observe(el)
    setWidth(Math.floor(el.getBoundingClientRect().width))

    return () => ro.disconnect()
  }, [ref])

  return width
}
