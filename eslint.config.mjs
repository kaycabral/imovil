// Root ESLint config: picked up by lint-staged and by workspaces without their own
// eslint.config.mjs (each still runs `eslint .` from its own dir, with its own
// eslint-suppressions.json).
import baseConfig from '@cbrl/eslint-config'

export default [
  ...baseConfig,
  {
    ignores: ['.husky/**'],
  },
  {
    files: ['packages/*/src/**/*.ts'],
    ignores: ['packages/*/src/**/*.test.ts'],
    rules: { 'no-console': 'error' },
  },
]
