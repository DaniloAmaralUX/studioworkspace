import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/cloud/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    clearMocks: true,
  },
})
