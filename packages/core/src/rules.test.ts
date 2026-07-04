import type { RuleInfo } from './types'

import { x } from 'tinyexec'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('tinyexec', () => ({
  x: vi.fn(),
}))

const mockedX = vi.mocked(x)

function commandResult(stdout: string): Awaited<ReturnType<typeof x>> {
  return { stdout } as Awaited<ReturnType<typeof x>>
}

async function importRulesModule() {
  return import('./rules')
}

describe('getOxlintRules', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    mockedX.mockReset()
  })

  test('returns an empty list when the Oxlint binary is unavailable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedX.mockRejectedValueOnce(new Error('command not found'))
    const { getOxlintRules } = await importRulesModule()

    await expect(getOxlintRules()).resolves.toEqual([])

    expect(mockedX).toHaveBeenCalledTimes(1)
    expect(mockedX).toHaveBeenCalledWith('oxlint', ['--version'])
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to inspect builtin Oxlint rules because the `oxlint` binary is not available on PATH.',
    )
  })

  test('returns parsed rules when the Oxlint binary is available', async () => {
    const rules: RuleInfo[] = [
      {
        category: 'correctness',
        default: true,
        docs_url: 'https://example.com/no-debugger',
        fix: 'none',
        scope: 'eslint',
        type_aware: false,
        value: 'no-debugger',
      },
    ]
    mockedX.mockResolvedValueOnce(commandResult('1.72.0')).mockResolvedValueOnce(commandResult(JSON.stringify(rules)))
    const { getOxlintRules } = await importRulesModule()

    await expect(getOxlintRules()).resolves.toEqual(rules)

    expect(mockedX).toHaveBeenCalledTimes(2)
    expect(mockedX).toHaveBeenNthCalledWith(1, 'oxlint', ['--version'])
    expect(mockedX).toHaveBeenNthCalledWith(2, 'oxlint', ['--rules', '--format=json'])
  })

  test('checks Oxlint binary availability only once per module instance', async () => {
    mockedX
      .mockResolvedValueOnce(commandResult('1.72.0'))
      .mockResolvedValueOnce(commandResult('[]'))
      .mockResolvedValueOnce(commandResult('[]'))
    const { getOxlintRules } = await importRulesModule()

    await getOxlintRules()
    await getOxlintRules()

    expect(mockedX).toHaveBeenCalledTimes(3)
    expect(mockedX).toHaveBeenNthCalledWith(1, 'oxlint', ['--version'])
    expect(mockedX).toHaveBeenNthCalledWith(2, 'oxlint', ['--rules', '--format=json'])
    expect(mockedX).toHaveBeenNthCalledWith(3, 'oxlint', ['--rules', '--format=json'])
  })
})
