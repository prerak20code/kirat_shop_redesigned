import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the built app works whether it's served from
  // https://username.github.io/ or https://username.github.io/repo-name/
  base: './',
})
