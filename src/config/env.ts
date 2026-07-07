/** 后端 Socket.io 地址：本地默认 3001，公网部署在 VITE_BACKEND_URL 环境变量中配置 */
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_SERVER_URL ||
  'http://localhost:3001'
