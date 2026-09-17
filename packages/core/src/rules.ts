import type { RuleInfo } from './types'

import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

import { x } from 'tinyexec'

let oxlintBinaryAvailability: Promise<boolean> | undefined

/**
 * Options for locating and invoking the project's linter.
 */
export type GetOxlintRulesOptions = {
  /** The project directory used to resolve and run Vite+. Defaults to `process.cwd()`. */
  cwd?: string
  /** Selects Vite+ instead of Oxlint. When omitted, detects Vite+ in the project. */
  useVitePlus?: boolean
}

/**
 * Fetches the list of builtin lint rules by invoking the linter binary.
 *
 * @param options - See {@link GetOxlintRulesOptions}.
 * @returns The parsed rules, or an empty array if the binary is unavailable or the invocation fails.
 */
export async function getOxlintRules(options?: GetOxlintRulesOptions): Promise<RuleInfo[]> {
  const cwd = path.resolve(options?.cwd ?? process.cwd())
  const entry = resolveVitePlusEntry(cwd)
  if (options?.useVitePlus ?? Boolean(entry)) {
    return getVitePlusRules(cwd, entry)
  }

  if (!(await isOxlintBinaryAvailable())) {
    console.error('Unable to inspect builtin Oxlint rules because the `oxlint` binary is not available on PATH.')
    return []
  }

  try {
    const rules = await x('oxlint', ['--rules', '--format=json'])
    return JSON.parse(rules.stdout) as RuleInfo[]
  } catch (error) {
    console.error('Error fetching Oxlint rules:', error)
    return []
  }
}

function resolveVitePlusEntry(cwd: string): string | undefined {
  const require = createRequire(path.join(cwd, 'package.json'))
  // Resolve only project ancestors, excluding unrelated packages on NODE_PATH.
  for (let directory = cwd; ; directory = path.dirname(directory)) {
    try {
      const packagePath = require.resolve(path.join(directory, 'node_modules/vite-plus/package.json'))
      return path.join(path.dirname(packagePath), 'bin/vp')
    } catch {
      if (path.dirname(directory) === directory) {
        return undefined
      }
    }
  }
}

async function getVitePlusRules(cwd: string, entry: string | undefined) {
  try {
    const args = ['lint', '--rules', '--format=json']
    const rules = await x(entry ? process.execPath : 'vp', entry ? [entry, ...args] : args, {
      nodeOptions: { cwd },
    })
    return JSON.parse(rules.stdout) as RuleInfo[]
  } catch (error) {
    console.error('Error fetching Vite+ rules:', error)
    return []
  }
}

async function isOxlintBinaryAvailable() {
  oxlintBinaryAvailability ??= checkOxlintBinaryAvailability()

  return oxlintBinaryAvailability
}

async function checkOxlintBinaryAvailability() {
  try {
    await x('oxlint', ['--version'])
    return true
  } catch {
    return false
  }
}
