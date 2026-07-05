import { defineConfig } from 'oxlint'

import { baseConfig } from './base'

export default defineConfig({
  extends: [baseConfig],
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'typescript/no-explicit-any': 'error',
      },
    },
  ],
  plugins: ['react'],
  rules: {
    'own/rule': 'error',
  },
})
