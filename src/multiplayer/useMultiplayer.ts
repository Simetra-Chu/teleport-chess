import { useCallback, useEffect, useState } from 'react'
import { initGame, type GameState, type TeleportConfig } from '../chessEngine'
import { emitAck, getSocket } from './socket'
import { DEFAULT_CONFIG } from './gameHelpers'
import type {
  CreateRoomAck,
  GameEndEvent,
  GameResult,
  JoinRoomAck,
  OpponentRequestEvent,
  OpponentRequestType,
  OpponentSyncEvent,
  PlayerColor,
  RequestRespondedEvent,
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
  gameResult: GameResult | null
  canUndo: boolean
  pendingOpponentRequest: OpponentRequestEvent | null
  pendingMyRequest: OpponentRequestType | null
  requestNotice: string | null
  setJoinInput: (v: string) => void
  setConfig: React.Dispatch<React.SetStateAction<TeleportConfig>>
  createRoom: () => Promise<void>
  joinRoom: () => Promise<void>
  leaveRoom: () => void
  resign: () => Promise<void>
  requestUndo: () => Promise<void>
  requestRestart: () => Promise<void>
  respondToRequest: (accept: boolean) => Promise<void>
  clearRequestNotice: () => void
  markCanUndo: () => void
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
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [pendingOpponentRequest, setPendingOpponentRequest] = useState<OpponentRequestEvent | null>(
    null,
  )
  const [pendingMyRequest, setPendingMyRequest] = useState<OpponentRequestType | null>(null)
  const [requestNotice, setRequestNotice] = useState<string | null>(null)

  const resetToLobby = useCallback((msg?: string) => {
    setPhase('lobby')
    setRoomCode(null)
    setRoomStatus(null)
    setPlayerColor(null)
    setConfig(DEFAULT_CONFIG)
    setGameState(initGame(DEFAULT_CONFIG))
    setJoinInput('')
    setGameResult(null)
    setCanUndo(false)
    setPendingOpponentRequest(null)
    setPendingMyRequest(null)
    setRequestNotice(null)
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
      setGameResult(null)
      setCanUndo(false)
      setPendingOpponentRequest(null)
      setPendingMyRequest(null)
      setRequestNotice(null)
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
      setCanUndo(false)
      setPendingMyRequest(null)
      setPendingOpponentRequest(null)
    }

    const onOpponentLeft = () => {
      setRoomStatus('waiting')
      setPendingOpponentRequest(null)
      setPendingMyRequest(null)
      setGameResult(null)
    }

    const onRoomClosed = () => {
      resetToLobby()
    }

    const onGameEnded = (data: GameEndEvent) => {
      setRoomStatus('finished')
      setGameResult({ reason: 'resign', winner: data.winner })
      setPendingOpponentRequest(null)
      setPendingMyRequest(null)
    }

    const onOpponentRequest = (data: OpponentRequestEvent) => {
      setPendingOpponentRequest(data)
    }

    const onRequestResponded = (data: RequestRespondedEvent) => {
      setPendingMyRequest(null)
      setPendingOpponentRequest(null)

      if (data.accept && data.gameState) {
        setGameState(data.gameState)
        setCanUndo(false)
        setRoomStatus('playing')
        setGameResult(null)
        setRequestNotice(data.type === 'undo' ? '悔棋已生效' : '棋局已重新开始')
      } else if (!data.accept) {
        setRequestNotice(data.type === 'undo' ? '对手拒绝了悔棋请求' : '对手拒绝了重开请求')
      }
    }

    socket.on('opponentJoined', onOpponentJoined)
    socket.on('opponentLeft', onOpponentLeft)
    socket.on('roomClosed', onRoomClosed)
    socket.on('gameEnded', onGameEnded)
    socket.on('opponentRequest', onOpponentRequest)
    socket.on('requestResponded', onRequestResponded)

    return () => {
      socket.off('opponentJoined', onOpponentJoined)
      socket.off('opponentLeft', onOpponentLeft)
      socket.off('roomClosed', onRoomClosed)
      socket.off('gameEnded', onGameEnded)
      socket.off('opponentRequest', onOpponentRequest)
      socket.off('requestResponded', onRequestResponded)
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

  const resign = useCallback(async () => {
    const res = await emitAck<GameEndEvent & { ok: boolean; error?: string }>('resign')
    if (!res.ok) throw new Error(res.error || '认输失败')
    setRoomStatus('finished')
    if (res.winner) setGameResult({ reason: 'resign', winner: res.winner })
  }, [])

  const requestUndo = useCallback(async () => {
    const res = await emitAck<{ ok: boolean; error?: string }>('requestUndo')
    if (!res.ok) throw new Error(res.error || '请求悔棋失败')
    setPendingMyRequest('undo')
    setRequestNotice(null)
  }, [])

  const requestRestart = useCallback(async () => {
    const res = await emitAck<{ ok: boolean; error?: string }>('requestRestart')
    if (!res.ok) throw new Error(res.error || '请求重开失败')
    setPendingMyRequest('restart')
    setRequestNotice(null)
  }, [])

  const respondToRequest = useCallback(async (accept: boolean) => {
    if (!pendingOpponentRequest) return
    const res = await emitAck<RequestRespondedEvent & { ok: boolean; error?: string }>(
      'respondRequest',
      { accept },
    )
    if (!res.ok) throw new Error(res.error || '回应失败')
    setPendingOpponentRequest(null)
  }, [pendingOpponentRequest])

  const clearRequestNotice = useCallback(() => setRequestNotice(null), [])

  const markCanUndo = useCallback(() => setCanUndo(true), [])

  const onOpponentSync = useCallback((handler: (event: OpponentSyncEvent) => void) => {
    const socket = getSocket()
    const onMove = (event: OpponentSyncEvent) => {
      setCanUndo(true)
      handler(event)
    }
    const onTeleport = (event: OpponentSyncEvent) => {
      setCanUndo(true)
      handler(event)
    }
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
    gameResult,
    canUndo,
    pendingOpponentRequest,
    pendingMyRequest,
    requestNotice,
    setJoinInput,
    setConfig,
    createRoom,
    joinRoom,
    leaveRoom,
    resign,
    requestUndo,
    requestRestart,
    respondToRequest,
    clearRequestNotice,
    markCanUndo,
    isOnline,
    isMyTurn,
    setGameState,
    onOpponentSync,
    patchConfig,
  }
}
