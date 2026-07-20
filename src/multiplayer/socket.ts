import { io, type Socket } from 'socket.io-client'
import { BACKEND_URL } from '../config/env'

let socket: Socket | null = null

export function getBackendUrl(): string {
  return BACKEND_URL
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/** 等待 Socket 连接就绪（用于 URL 自动加入） */
export function waitForSocketConnected(timeoutMs = 10000): Promise<void> {
  const s = getSocket()
  if (s.connected) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('连接服务器超时，请稍后重试'))
    }, timeoutMs)

    const onConnect = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      window.clearTimeout(timer)
      s.off('connect', onConnect)
    }

    s.on('connect', onConnect)
    if (!s.active) s.connect()
  })
}

export function emitAck<T>(event: string, payload?: unknown): Promise<T> {
  return new Promise((resolve) => {
    getSocket().emit(event, payload ?? {}, (response: T) => resolve(response))
  })
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
