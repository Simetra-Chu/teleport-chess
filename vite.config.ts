import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['Chrome >= 49', 'Android >= 6', 'iOS >= 11', 'Safari >= 11'],
      renderLegacyChunks: true,
    }),
  ],
})
