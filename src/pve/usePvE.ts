import { useCallback, useEffect, useRef, useState } from 'react'
import { initGame, type GameState, type TeleportConfig } from '../chessEngine'
import { getGameOutcome } from '../gameStatus'
import { DEFAULT_CONFIG } from '../multiplayer/gameHelpers'
import type { GameResult, PlayerColor } from '../multiplayer/types'
import { AI_THINK_DELAY_MS, pickAiMove } from '../ai/pickMove'
import { applyAiMove } from '../ai/applyMove'
import type { AiDifficulty } from '../ai/types'

export type PvEPhase = 'lobby' | 'game'

export function usePvE() {
  const [phase, setPhase] = useState<PvEPhase>('lobby')
  const [config, setConfig] = useState<TeleportConfig>({ ...DEFAULT_CONFIG })
  const [gameState, setGameState] = useState<GameState>(() => initGame(DEFAULT_CONFIG))
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white')
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium')
  const [aiThinking, setAiThinking] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const aiColor: PlayerColor = playerColor === 'white' ? 'black' : 'white'
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patchConfig = useCallback((partial: Partial<TeleportConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const startGame = useCallback(
    (color: PlayerColor, diff: AiDifficulty, cfg: TeleportConfig) => {
      setConfig(cfg)
      setPlayerColor(color)
      setDifficulty(diff)
      setGameState(initGame(cfg))
      setGameResult(null)
      setAiThinking(false)
      setPhase('game')
    },
    [],
  )

  const leaveGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    setAiThinking(false)
    setGameResult(null)
    setPhase('lobby')
  }, [])

  const resign = useCallback(async () => {
    setGameResult({ winner: aiColor, reason: 'resign' })
  }, [aiColor])

  const restartGame = useCallback(() => {
    setGameState(initGame(config))
    setGameResult(null)
    setAiThinking(false)
  }, [config])

  useEffect(() => {
    if (phase !== 'game' || gameResult || aiThinking) return

    const aiIsWhite = aiColor === 'white'
    if (gameState.white_turn !== aiIsWhite) return

    const outcome = getGameOutcome(gameState, config)
    if (outcome.status !== 'ongoing') return

    setAiThinking(true)
    aiTimerRef.current = setTimeout(() => {
      const move = pickAiMove(gameState, config, difficulty, aiIsWhite)
      if (move) {
        setGameState(applyAiMove(gameState, config, move))
      }
      setAiThinking(false)
    }, AI_THINK_DELAY_MS)

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [gameState, config, difficulty, aiColor, phase, gameResult, aiThinking])

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    }
  }, [])

  return {
    phase,
    config,
    patchConfig,
    gameState,
    setGameState,
    playerColor,
    difficulty,
    setDifficulty,
    aiColor,
    aiThinking,
    gameResult,
    startGame,
    leaveGame,
    resign,
    restartGame,
  }
}
