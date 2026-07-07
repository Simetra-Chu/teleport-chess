/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 公网后端地址，如 https://your-api.railway.app */
  readonly VITE_BACKEND_URL?: string
  /** 旧版变量名，仍兼容 */
  readonly VITE_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
