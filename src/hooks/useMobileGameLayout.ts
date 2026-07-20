import { useEffect, useState } from 'react'

/** 与 CSS 断点 max-width: 1023px 一致 */
export function useMobileGameLayout() {
  const [mobile, setMobile] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return mobile
}
