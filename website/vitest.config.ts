import { defineConfig } from 'vitest/config';

// Unit tests for the build-time helpers (src/lib). No network: every test mocks fetch.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    maxWorkers: 4,
    env: { NETSLUICE_RELEASES_OFFLINE: '1' },
  },
});
