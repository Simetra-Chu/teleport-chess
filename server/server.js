/**
 * 瞬移国际象棋 · 轻量级联机服务端
 * Express + Socket.io 实时房间与走棋同步
 */
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = Number(process.env.PORT) || 3001

/** @type {string | string[] | boolean} */
const corsOrigin = (() => {
  const url = process.env.FRONTEND_URL?.trim()
  if (!url || url === '*') return true
  return url.split(',').map((s) => s.trim()).filter(Boolean)
})()

/** @typedef {'white' | 'black'} PlayerColor */

/**
 * @typedef {object} TeleportConfig
 * @property {number} each_side_tp_times
 * @property {boolean} tp_any_piece
 * @property {boolean} tp_cannot_capture
 * @property {boolean} tp_cannot_check
 * @property {boolean} pawn_tp_no_promote
 */

/**
 * @typedef {object} GameState
 * @property {string[][]} board
 * @property {boolean} white_turn
 * @property {number} white_tp_left
 * @property {number} black_tp_left
 * @property {Record<string, boolean>} pawn_tp_status
 * @property {boolean} white_king_moved
 * @property {boolean} black_king_moved
 * @property {boolean} white_a_rook_moved
 * @property {boolean} white_h_rook_moved
 * @property {boolean} black_a_rook_moved
 * @property {boolean} black_h_rook_moved
 * @property {[number, number] | null} ep_target
 */

/** @type {TeleportConfig} */
const DEFAULT_CONFIG = {
  each_side_tp_times: 1,
  tp_any_piece: true,
  tp_cannot_capture: true,
  tp_cannot_check: true,
  pawn_tp_no_promote: true,
}

/** @param {TeleportConfig} config @returns {GameState} */
function createInitialGameState(config) {
  return {
    board: [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ],
    white_turn: true,
    white_tp_left: config.each_side_tp_times,
    black_tp_left: config.each_side_tp_times,
    pawn_tp_status: {},
    white_king_moved: false,
    black_king_moved: false,
    white_a_rook_moved: false,
    white_h_rook_moved: false,
    black_a_rook_moved: false,
    black_h_rook_moved: false,
    ep_target: null,
  }
}

/** @param {Map<string, object>} rooms */
function generateRoomCode(rooms) {
  for (let i = 0; i < 100; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000))
    if (!rooms.has(code)) return code
  }
  throw new Error('无法生成唯一房间号')
}

/**
 * 房主 = 白方，加入者 = 黑方
 * @param {object} room
 * @param {string} socketId
 * @returns {PlayerColor | null}
 */
function getPlayerColor(room, socketId) {
  if (room.hostId === socketId) return 'white'
  if (room.guestId === socketId) return 'black'
  return null
}

/**
 * @param {GameState} prev
 * @param {GameState} next
 * @param {PlayerColor} mover
 */
function assertTurnAdvanced(prev, next, mover) {
  const prevTurn = prev.white_turn ? 'white' : 'black'
  if (prevTurn !== mover) {
    throw new Error('不是你的回合')
  }
  if (prev.white_turn === next.white_turn) {
    throw new Error('走棋后回合未切换')
  }
}

/** @param {Function} ack @param {object} payload */
function reply(ack, payload) {
  if (typeof ack === 'function') ack(payload)
}

const app = express()
app.use(cors({ origin: corsOrigin }))
app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
})

/** @type {Map<string, {
 *   code: string,
 *   hostId: string,
 *   guestId: string | null,
 *   config: TeleportConfig,
 *   gameState: GameState,
 *   status: 'waiting' | 'playing' | 'finished',
 * }>} */
const rooms = new Map()

/** @type {Map<string, string>} socketId -> roomCode */
const socketRoom = new Map()

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`)

  socket.on('createRoom', (payload = {}, ack) => {
    try {
      if (socketRoom.has(socket.id)) {
        return reply(ack, { ok: false, error: '你已在房间中，请先离开' })
      }

      const config = { ...DEFAULT_CONFIG, ...(payload.config || {}) }
      const code = generateRoomCode(rooms)
      const gameState = createInitialGameState(config)

      const room = {
        code,
        hostId: socket.id,
        guestId: null,
        config,
        gameState,
        status: 'waiting',
      }

      rooms.set(code, room)
      socketRoom.set(socket.id, code)
      socket.join(code)

      console.log(`[createRoom] ${code} by ${socket.id}`)

      reply(ack, {
        ok: true,
        roomCode: code,
        color: 'white',
        config,
        gameState,
        status: room.status,
      })
    } catch (err) {
      reply(ack, { ok: false, error: err.message || '创建房间失败' })
    }
  })

  socket.on('joinRoom', (payload = {}, ack) => {
    try {
      const code = String(payload.roomCode || '').trim()
      if (!/^\d{4}$/.test(code)) {
        return reply(ack, { ok: false, error: '请输入 4 位数字房间号' })
      }
      if (socketRoom.has(socket.id)) {
        return reply(ack, { ok: false, error: '你已在房间中，请先离开' })
      }

      const room = rooms.get(code)
      if (!room) {
        return reply(ack, { ok: false, error: '房间不存在' })
      }
      if (room.guestId) {
        return reply(ack, { ok: false, error: '房间已满' })
      }
      if (room.hostId === socket.id) {
        return reply(ack, { ok: false, error: '不能加入自己创建的房间' })
      }

      room.guestId = socket.id
      room.status = 'playing'
      socketRoom.set(socket.id, code)
      socket.join(code)

      console.log(`[joinRoom] ${code} guest ${socket.id} (black)`)

      const guestPayload = {
        ok: true,
        roomCode: code,
        color: 'black',
        config: room.config,
        gameState: room.gameState,
        status: room.status,
      }
      reply(ack, guestPayload)

      io.to(room.hostId).emit('opponentJoined', {
        roomCode: code,
        color: 'white',
        gameState: room.gameState,
        config: room.config,
        status: room.status,
      })
    } catch (err) {
      reply(ack, { ok: false, error: err.message || '加入房间失败' })
    }
  })

  socket.on('move', (payload = {}, ack) => {
    try {
      const room = getRoomForSocket(socket.id)
      const color = getPlayerColor(room, socket.id)
      if (!color) throw new Error('你不在这个房间')
      if (room.status !== 'playing') throw new Error('对局尚未开始')

      const { gameState, move } = payload
      if (!gameState || !move) throw new Error('缺少 gameState 或 move')

      assertTurnAdvanced(room.gameState, gameState, color)

      room.gameState = gameState

      const event = {
        roomCode: room.code,
        type: 'move',
        by: color,
        move: {
          fr: move.fr,
          fc: move.fc,
          tr: move.tr,
          tc: move.tc,
          promoPiece: move.promoPiece ?? null,
        },
        gameState,
      }

      socket.to(room.code).emit('move', event)
      reply(ack, { ok: true, gameState })
      console.log(`[move] room ${room.code} by ${color}`)
    } catch (err) {
      reply(ack, { ok: false, error: err.message || '同步走棋失败' })
    }
  })

  socket.on('teleport', (payload = {}, ack) => {
    try {
      const room = getRoomForSocket(socket.id)
      const color = getPlayerColor(room, socket.id)
      if (!color) throw new Error('你不在这个房间')
      if (room.status !== 'playing') throw new Error('对局尚未开始')

      const { gameState, move } = payload
      if (!gameState || !move) throw new Error('缺少 gameState 或 move')

      assertTurnAdvanced(room.gameState, gameState, color)

      room.gameState = gameState

      const event = {
        roomCode: room.code,
        type: 'teleport',
        by: color,
        move: { fr: move.fr, fc: move.fc, tr: move.tr, tc: move.tc },
        gameState,
      }

      socket.to(room.code).emit('teleport', event)
      reply(ack, { ok: true, gameState })
      console.log(`[teleport] room ${room.code} by ${color}`)
    } catch (err) {
      reply(ack, { ok: false, error: err.message || '同步瞬移失败' })
    }
  })

  socket.on('leaveRoom', (_payload, ack) => {
    leaveRoom(socket)
    reply(ack, { ok: true })
  })

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`)
    leaveRoom(socket)
  })
})

/** @param {string} socketId */
function getRoomForSocket(socketId) {
  const code = socketRoom.get(socketId)
  if (!code) throw new Error('未加入任何房间')
  const room = rooms.get(code)
  if (!room) throw new Error('房间已失效')
  return room
}

/** @param {import('socket.io').Socket} socket */
function leaveRoom(socket) {
  const code = socketRoom.get(socket.id)
  if (!code) return

  const room = rooms.get(code)
  socketRoom.delete(socket.id)
  socket.leave(code)

  if (!room) return

  if (room.hostId === socket.id) {
    io.to(code).emit('roomClosed', { reason: '房主已离开，房间关闭' })
    for (const [sid, rc] of socketRoom.entries()) {
      if (rc === code) socketRoom.delete(sid)
    }
    rooms.delete(code)
    console.log(`[roomClosed] ${code}`)
    return
  }

  if (room.guestId === socket.id) {
    room.guestId = null
    room.status = 'waiting'
    io.to(room.hostId).emit('opponentLeft', { roomCode: code })
    console.log(`[opponentLeft] ${code}`)
  }
}

httpServer.listen(PORT, () => {
  console.log(`Teleport Chess server listening on http://localhost:${PORT}`)
})
