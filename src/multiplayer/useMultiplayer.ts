import { useCallback, useEffect, useState } from 'react'
import { initGame, type GameState, type TeleportConfig } from '../chessEngine'
import { emitAck, getSocket } from './socket'
import { DEFAULT_CONFIG } from './gameHelpers'
import type {
  CreateRoomAck,
  JoinRoomAck,
  OpponentSyncEvent,
  PlayerColor,
  RoomStatus,
} from './types'

export type AppPhase = 'lobby' | 'room'

export interface MultiplayerState {
  phase: AppPhase
  roomCode: string | null
  roomStatus: RoomStatus | null
  playerColor: PlayerColor | null
  config: TeleportConfig
  gameState: GameState
  joinInput: string
  loading: boolean
  setJoinInput: (v: string) => void
  setConfig: React.Dispatch<React.SetStateAction<TeleportConfig>>
  createRoom: () => Promise<void>
  joinRoom: () => Promise<void>
  leaveRoom: () => void
  isOnline: boolean
  isMyTurn: boolean
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  onOpponentSync: (handler: (event: OpponentSyncEvent) => void) => () => void
}

export function useMultiplayer(): MultiplayerState & {
  patchConfig: (p: Partial<TeleportConfig>) => void
} {
  const [phase, setPhase] = useState<AppPhase>('lobby')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null)
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null)
  const [config, setConfig] = useState<TeleportConfig>(DEFAULT_CONFIG)
  const [gameState, setGameState] = useState<GameState>(() => initGame(DEFAULT_CONFIG))
  const [joinInput, setJoinInput] = useState('')
  const [loading, setLoading] = useState(false)

  const resetToLobby = useCallback((msg?: string) => {
    setPhase('lobby')
    setRoomCode(null)
    setRoomStatus(null)
    setPlayerColor(null)
    setConfig(DEFAULT_CONFIG)
    setGameState(initGame(DEFAULT_CONFIG))
    setJoinInput('')
    if (msg) console.info(msg)
  }, [])

  const enterRoom = useCallback(
    (code: string, color: PlayerColor | null, cfg: TeleportConfig, state: GameState, status: RoomStatus) => {
      setPhase('room')
      setRoomCode(code)
      setPlayerColor(color)
      setConfig(cfg)
      setGameState(state)
      setRoomStatus(status)
    },
    [],
  )

  useEffect(() => {
    const socket = getSocket()

    const onOpponentJoined = (data: {
      roomCode: string
      color: PlayerColor
      gameState: GameState
      config: TeleportConfig
      status: RoomStatus
    }) => {
      setRoomStatus('playing')
      setPlayerColor(data.color)
      setGameState(data.gameState)
      setConfig(data.config)
    }

    const onOpponentLeft = () => {
      setRoomStatus('waiting')
    }

    const onRoomClosed = () => {
      resetToLobby()
    }

    socket.on('opponentJoined', onOpponentJoined)
    socket.on('opponentLeft', onOpponentLeft)
    socket.on('roomClosed', onRoomClosed)

    return () => {
      socket.off('opponentJoined', onOpponentJoined)
      socket.off('opponentLeft', onOpponentLeft)
      socket.off('roomClosed', onRoomClosed)
    }
  }, [resetToLobby])

  const createRoom = useCallback(async () => {
    setLoading(true)
    try {
      const res = await emitAck<CreateRoomAck>('createRoom', { config })
      if (!res.ok || !res.roomCode || !res.gameState || !res.config) {
        throw new Error(res.error || '创建房间失败')
      }
      enterRoom(res.roomCode, res.color ?? 'white', res.config, res.gameState, res.status ?? 'waiting')
    } finally {
      setLoading(false)
    }
  }, [config, enterRoom])

  const joinRoom = useCallback(async () => {
    const code = joinInput.trim()
    if (!/^\d{4}$/.test(code)) {
      throw new Error('请输入 4 位数字房间号')
    }
    setLoading(true)
    try {
      const res = await emitAck<JoinRoomAck>('joinRoom', { roomCode: code })
      if (!res.ok || !res.roomCode || !res.color || !res.gameState || !res.config) {
        throw new Error(res.error || '加入房间失败')
      }
      enterRoom(res.roomCode, res.color, res.config, res.gameState, res.status ?? 'playing')
    } finally {
      setLoading(false)
    }
  }, [joinInput, enterRoom])

  const leaveRoom = useCallback(() => {
    emitAck('leaveRoom')
    resetToLobby()
  }, [resetToLobby])

  const onOpponentSync = useCallback((handler: (event: OpponentSyncEvent) => void) => {
    const socket = getSocket()
    const onMove = (event: OpponentSyncEvent) => handler(event)
    const onTeleport = (event: OpponentSyncEvent) => handler(event)
    socket.on('move', onMove)
    socket.on('teleport', onTeleport)
    return () => {
      socket.off('move', onMove)
      socket.off('teleport', onTeleport)
    }
  }, [])

  const isOnline = phase === 'room'
  const isMyTurn =
    !isOnline ||
    !playerColor ||
    (playerColor === 'white' ? gameState.white_turn : !gameState.white_turn)

  const patchConfig = (partial: Partial<TeleportConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }

  return {
    phase,
    roomCode,
    roomStatus,
    playerColor,
    config,
    gameState,
    joinInput,
    loading,
    setJoinInput,
    setConfig,
    createRoom,
    joinRoom,
    leaveRoom,
    isOnline,
    isMyTurn,
    setGameState,
    onOpponentSync,
    patchConfig,
  }
}
