import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Native file events are occasionally missed on Windows; polling keeps HMR honest.
    watch: { usePolling: true, interval: 150 },
  },
})
