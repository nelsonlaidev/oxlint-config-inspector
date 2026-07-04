import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { getConfig } from './config'

const fixtureRoot = new URL('../test/fixtures/', import.meta.url)
const temporaryDirectories: string[] = []

describe('getConfig', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { force: true, recursive: true })
      }),
    )
  })

  test('loads and merges JSON extends with only extendable inherited fields', async () => {
    const cwd = new URL('json-extends/', fixtureRoot)
    const result = await getConfig({ configFile: 'oxlint-fixture.json', cwd: cwd.pathname })

    expect(result).not.toBeNull()
    expect(result?.files.map((file) => file.replace(cwd.pathname, ''))).toEqual(['oxlint-fixture.json', 'base.json'])
    expect(result?.config).toMatchObject({
      env: {
        builtin: true,
      },
      overrides: [
        {
          files: ['**/*.js'],
          rules: {
            'no-alert': 'warn',
          },
        },
        {
          files: ['**/*.ts'],
          rules: {
            'typescript/no-explicit-any': 'error',
          },
        },
      ],
      plugins: ['react', 'typescript'],
      rules: {
        eqeqeq: 'warn',
        'eslint/no-debugger': 'error',
      },
    })
    expect(result?.config).not.toHaveProperty('categories')
    expect(result?.config).not.toHaveProperty('jsPlugins')
  })

  test('searches, loads, and merges JSONC extends', async () => {
    const cwd = new URL('jsonc-extends/', fixtureRoot)
    const result = await getConfig({ cwd: cwd.pathname })

    expect(result).not.toBeNull()
    expect(result?.filepath.endsWith('/.oxlintrc.jsonc')).toBe(true)
    expect(result?.files.map((file) => file.replace(cwd.pathname, ''))).toEqual(['.oxlintrc.jsonc', 'base.jsonc'])
    expect(result?.config).toMatchObject({
      env: {
        builtin: true,
      },
      overrides: [
        {
          files: ['**/*.js'],
          rules: {
            'no-alert': 'warn',
          },
        },
        {
          files: ['**/*.ts'],
          rules: {
            'typescript/no-explicit-any': 'error',
          },
        },
      ],
      plugins: ['react', 'typescript'],
      rules: {
        eqeqeq: 'warn',
        'eslint/no-debugger': 'error',
      },
    })
    expect(result?.config).not.toHaveProperty('categories')
  })

  test('loads explicit config files relative to cwd', async () => {
    const cwd = new URL('json-extends/', fixtureRoot)
    const result = await getConfig({ configFile: 'base.json', cwd: cwd.pathname })

    expect(result?.filepath.endsWith('/base.json')).toBe(true)
    expect(result?.config.rules).toEqual({
      eqeqeq: 'warn',
      'eslint/no-debugger': 'warn',
    })
  })

  test('loads TypeScript config with inline extends', async () => {
    const cwd = new URL('ts-inline/', fixtureRoot)
    const result = await getConfig({ configFile: 'oxlint-fixture.config.ts', cwd: cwd.pathname })

    expect(result).not.toBeNull()
    expect(result?.config).toMatchObject({
      env: {
        browser: true,
      },
      overrides: [
        {
          files: ['**/*.ts'],
          rules: {
            'override/base': 'warn',
          },
        },
      ],
      plugins: ['typescript', 'react'],
      rules: {
        'base/rule': 'error',
        'next/rule': 'warn',
        'own/rule': 'error',
      },
    })
    expect(result?.config.env).toEqual({
      browser: true,
    })
  })

  test('throws for circular JSON extends', async () => {
    const cwd = new URL('circular/', fixtureRoot)

    await expect(getConfig({ configFile: 'oxlint-fixture.json', cwd: cwd.pathname })).rejects.toThrow(
      'Circular Oxlint config extends detected',
    )
  })

  test('returns null when no config is found', async () => {
    const cwd = new URL('empty/', fixtureRoot)

    await expect(getConfig({ cwd: cwd.pathname })).resolves.toBeNull()
  })

  test('reloads changed config content when cache is disabled', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'oxlint-config-inspector-'))
    temporaryDirectories.push(cwd)
    const configFilepath = path.join(cwd, '.oxlintrc.json')

    await writeFile(configFilepath, JSON.stringify({ rules: { eqeqeq: 'warn' } }))
    await getConfig({ cwd })
    await writeFile(configFilepath, JSON.stringify({ rules: { eqeqeq: 'error' } }))

    const result = await getConfig({ cache: false, cwd })

    expect(result?.config.rules).toEqual({ eqeqeq: 'error' })
  })
})
