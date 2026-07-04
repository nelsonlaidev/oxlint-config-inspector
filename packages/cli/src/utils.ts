import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function resolveAppRoot() {
  const indexHtmlPath = fileURLToPath(new URL('app/index.html', import.meta.url))

  if (existsSync(indexHtmlPath)) {
    return path.dirname(indexHtmlPath)
  }

  throw new Error('Unable to locate bundled inspector app.')
}
