import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // v7 still ships the legacy array form under `configs.recommended*`; the
  // flat-config object lives under `configs.flat`.
  reactHooks.configs.flat.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    // Config and tooling scripts run in Node, not the browser.
    files: ['vite.config.ts', 'vitest.config.ts', 'scripts/**/*.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
  },
);
