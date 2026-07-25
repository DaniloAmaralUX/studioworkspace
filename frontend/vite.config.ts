import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Um único split GROSSO (react + renderer): vendor estável em cache
        // próprio, download paralelo, e cada chunk fica sob o orçamento de
        // 500 kB do verify.ps1. 'react-dom/client' precisa estar listado —
        // sem ele só a fachada do react-dom (~12 kB) sai do index e o
        // renderer (~180 kB) fica pra trás. (manualChunks "fino" por lib/rota
        // segue proibido — ver docs/plans/automode-2026-07-24.md § F4.)
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-dom/client'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5177,
    strictPort: true,
  },
})
