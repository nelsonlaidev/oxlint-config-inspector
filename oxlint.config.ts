import { defineConfig } from '@nelsonlaidev/oxlint-config'

export default defineConfig({
  custom: {
    react: true,
    tailwindcss: {
      entryPoint: './src/styles/globals.css',
      cwd: './packages/app',
    },
  },
})
