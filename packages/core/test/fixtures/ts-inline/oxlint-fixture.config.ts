import { defineConfig } from 'oxlint'

const config = defineConfig({
  extends: [
    {
      env: {
        node: true,
      },
      plugins: ['typescript'],
      rules: {
        'base/rule': 'warn',
      },
    },
    {
      overrides: [
        {
          files: ['**/*.ts'],
          rules: {
            'override/base': 'warn',
          },
        },
      ],
      rules: {
        'base/rule': 'error',
        'next/rule': 'warn',
      },
    },
  ],
  env: {
    browser: true,
  },
  plugins: ['react'],
  rules: {
    'own/rule': 'error',
  },
})

export default config
