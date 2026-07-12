import type { RuleInfo } from './types'

import { x } from 'tinyexec'

let oxlintBinaryAvailability: Promise<boolean> | undefined

/**
 * @param useVitePlus - When `true`, runs `vp lint --rules --format=json` instead of `oxlint --rules --format=json`.
 */
export async function getOxlintRules(options?: { useVitePlus?: boolean }) {
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
