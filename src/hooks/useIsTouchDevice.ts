import { useEffect, useState } from 'react'

/** 检测触控设备，用于关闭拖拽、缩短动画等 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches,
    )
  }, [])

  return isTouch
}
