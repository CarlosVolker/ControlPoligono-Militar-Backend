import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

const { server, ...viteTransformConfig } = viteConfig
void server

export default mergeConfig(
  viteTransformConfig,
  defineConfig({
    test: {
      globals: false,
      environment: 'jsdom',
      include: ['tests/focused/**/*.test.ts'],
      isolate: true,
      clearMocks: true,
      restoreMocks: true,
    },
  }),
)
