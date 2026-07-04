import path from 'node:path'

import { createLogger } from 'vite'

export const logger = createLogger('info', {
  prefix: '[inspector]',
})

export function formatFilepath(cwd: string, filepath: string) {
  const relativePath = path.relative(cwd, filepath)

  if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return relativePath
  }

  return filepath
}

export function formatCount(count: number, noun: string) {
  return `${formatNumber(count)} ${noun}${count === 1 ? '' : 's'}`
}

export function formatNumber(count: number) {
  return new Intl.NumberFormat('en-US').format(count)
}
