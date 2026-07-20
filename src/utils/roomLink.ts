const ROOM_PARAM = 'room'

/** 从当前 URL 读取 4 位房间号 */
export function getRoomFromUrl(search = window.location.search): string | null {
  const raw = new URLSearchParams(search).get(ROOM_PARAM)?.trim() ?? ''
  return /^\d{4}$/.test(raw) ? raw : null
}

/** 生成可分享的邀请链接（基于当前页面 origin + path） */
export function buildRoomInviteUrl(roomCode: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set(ROOM_PARAM, roomCode)
  url.hash = ''
  return url.toString()
}

/** 进入房间后同步 URL，便于房主复制地址栏链接 */
export function setRoomInUrl(roomCode: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set(ROOM_PARAM, roomCode)
  window.history.replaceState(window.history.state, '', url)
}

/** 离开房间时清除 URL 中的 room 参数 */
export function clearRoomFromUrl(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(ROOM_PARAM)) return
  url.searchParams.delete(ROOM_PARAM)
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', next || url.pathname)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('复制失败，请手动复制链接')
}
