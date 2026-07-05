import { defineConfig } from 'oxlint'

export const baseConfig = defineConfig({
  plugins: ['typescript'],
  rules: {
    'base/rule': 'warn',
  },
})
