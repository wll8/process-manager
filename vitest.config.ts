import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '**/*.js'],
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '*.config.{js,ts}'
      ]
    }
  },
  esbuild: {
    target: 'node16'
  }
})