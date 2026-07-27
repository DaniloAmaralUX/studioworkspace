import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Testes de guarda do core (F3): unidade (filterProjects) + componente
// (NextActionInput, OpenWithButtons) em jsdom. Sem Playwright, sem snapshots.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
