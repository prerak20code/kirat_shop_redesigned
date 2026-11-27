import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  // Relative base so the built app works whether it's served from
  // https://username.github.io/ or https://username.github.io/repo-name/
  base: './',
})
