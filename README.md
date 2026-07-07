# 瞬移国际象棋 · Teleport Chess

React + TypeScript 联机国际象棋，支持自定义「瞬移」规则。

## 本地开发

```bash
# 前端
npm install
npm run dev          # http://localhost:5173

# 后端（另开终端）
cd server && npm install && npm start   # http://localhost:3001
```

可选：复制 `.env.example` 为 `.env.local`，默认已指向 `http://localhost:3001`。

## 项目结构

```
teleport-chess/
├── src/                 # Vite + React 前端
│   ├── chessEngine.ts   # 瞬移规则核心
│   ├── config/env.ts    # VITE_BACKEND_URL 配置
│   └── multiplayer/     # Socket.io 客户端
├── server/              # Express + Socket.io 后端
│   └── server.js
├── vercel.json          # Vercel 前端部署
└── .env.example
```

## 公网部署

### 1. 后端（Railway / Render / Fly.io 等）

部署 `server/` 目录：

| 环境变量 | 说明 |
|---------|------|
| `PORT` | 平台自动注入，无需手动设置 |
| `FRONTEND_URL` | 前端域名，如 `https://your-app.vercel.app` |

启动命令：`npm start`（工作目录 `server`）

记录后端公网 URL，例如 `https://teleport-chess-api.onrender.com`

### 2. 前端（Vercel）

1. 导入本仓库到 Vercel
2. Framework Preset：**Vite**
3. 添加环境变量：

```
VITE_BACKEND_URL=https://your-backend-url.com
```

4. 部署完成后，将 Vercel 域名填回后端 `FRONTEND_URL`

### 3. 验证

- 后端：`GET https://your-api/health` → `{ "ok": true }`
- 前端：打开 Vercel 地址，创建房间，另一浏览器加入

## Socket 事件

| 事件 | 说明 |
|------|------|
| `createRoom` | 创建房间，房主为**白方** |
| `joinRoom` | 加入房间，加入者为**黑方** |
| `move` | 同步普通走法 |
| `teleport` | 同步瞬移 |

## 环境变量

**前端**（`.env.local` / Vercel）：

```
VITE_BACKEND_URL=http://localhost:3001
```

**后端**（`server/.env`）：

```
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```
