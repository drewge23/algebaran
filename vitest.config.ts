import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Kept separate from `vite.config.ts` on purpose: Vitest bundles its own Vite,
 * and mixing the two configs makes their plugin types collide. The unit tests
 * cover pure logic only, so they need the path alias and nothing else.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
