import type { RuleInfo } from './types'

import { x } from 'tinyexec'

let oxlintBinaryAvailability: Promise<boolean> | undefined

export type GetOxlintRulesOptions = {
  /** When `true`, invokes the Vite+ (`vp`) binary instead of `oxlint`. */
  useVitePlus?: boolean
}

/**
 * Fetches the list of builtin lint rules by invoking the linter binary.
 *
 * @param options - See {@link GetOxlintRulesOptions}.
 * @returns The parsed rules, or an empty array if the binary is unavailable or the invocation fails.
 */
export async function getOxlintRules(options?: GetOxlintRulesOptions): Promise<RuleInfo[]> {
  if (options?.useVitePlus) {
    return getVitePlusRules()
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

async function getVitePlusRules() {
  try {
    const rules = await x('vp', ['lint', '--rules', '--format=json'])
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
