import { defineConfig, react, tailwindcss } from '@nelsonlaidev/oxlint-config'

export default defineConfig({
  settings: {
    'better-tailwindcss': {
      entryPoint: 'src/styles/globals.css',
      cwd: 'packages/app',
    },
  },
  overrides: [react(), tailwindcss()],
})
