import type { RuleInfo } from './types'

import { x } from 'tinyexec'

let oxlintBinaryAvailability: Promise<boolean> | undefined

export async function getOxlintRules() {
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
