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
