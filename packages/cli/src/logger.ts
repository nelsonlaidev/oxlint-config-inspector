import path from 'node:path'

import colors from 'picocolors'

type LogLevel = 'error' | 'info' | 'warn'

const DEV_LOGGER_PREFIX = '[inspector]'

export const devLogger = {
  error(message: string) {
    writeDevLog('error', message)
  },
  info(message: string) {
    writeDevLog('info', message)
  },
  warn(message: string) {
    writeDevLog('warn', message)
  },
}

export const logger = {
  error(message: string) {
    process.stderr.write(`${message}\n`)
  },
  info(message: string) {
    process.stdout.write(`${message}\n`)
  },
  success(message: string) {
    process.stdout.write(`${message}\n`)
  },
}

function writeDevLog(level: LogLevel, message: string) {
  const color = getLogLevelColor(level)
  const timestamp = colors.dim(new Date().toLocaleTimeString())
  const prefix = color(colors.bold(DEV_LOGGER_PREFIX))
  const stream = level === 'error' ? process.stderr : process.stdout

  stream.write(`${timestamp} ${prefix} ${message}\n`)
}

function getLogLevelColor(level: LogLevel) {
  if (level === 'error') {
    return colors.red
  }

  if (level === 'warn') {
    return colors.yellow
  }

  return colors.cyan
}

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

export function formatHighlightedCount(count: number, noun: string) {
  return `${colors.yellow(formatNumber(count))} ${noun}${count === 1 ? '' : 's'}`
}

export function formatNumber(count: number) {
  return new Intl.NumberFormat('en-US').format(count)
}

export function formatDisplayPath(cwd: string, filepath: string) {
  return colors.bold(formatFilepath(cwd, filepath))
}

export function formatCommand(command: string) {
  return colors.bold(`\`${command}\``)
}

export function formatSuccessWord(word: string) {
  return colors.green(word)
}
