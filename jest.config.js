/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Map the `@/*` path alias (mirrors tsconfig.json) so tests can import from src.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
