# 联机服务端

Express + Socket.io，处理房间与走棋同步。

## 本地运行

```bash
npm install
npm start
# 默认 http://localhost:3001
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 监听端口，默认 3001 |
| `FRONTEND_URL` | 允许跨域的前端地址；多个用逗号分隔；不设则允许全部（仅建议开发用） |

## 阵营规则

- **创建房间** → 白方
- **加入房间** → 黑方

## 云端部署示例（Render）

1. New Web Service → 连接仓库，Root Directory 设为 `server`
2. Build: `npm install`，Start: `npm start`
3. 环境变量 `FRONTEND_URL` = 你的 Vercel 域名

## API

- `GET /health` → `{ ok: true, rooms: N }`

## Socket 事件

见项目根目录 README。
