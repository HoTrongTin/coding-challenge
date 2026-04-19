import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './tests/global-setup.ts',
    setupFiles: ['./tests/setup-env.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'prisma/', 'tests/'],
    },
    testTimeout: 30000,
  },
});
