import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { shadowStyle } from 'vite-plugin-shadow-style';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  shadowStyle()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: `electricity-flow-card.js`
      },
    },
  },
})
