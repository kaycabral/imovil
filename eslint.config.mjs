// Root ESLint config: picked up by lint-staged and by workspaces without their own
// eslint.config.mjs (each still runs `eslint .` from its own dir, with its own
// eslint-suppressions.json).
import baseConfig from '@imovil/eslint-config'

export default [
  ...baseConfig,
  {
    ignores: ['.husky/**'],
  },
]
