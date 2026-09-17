import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, test } from 'vitest'

import { getConfig } from './config'

const fixtureRoot = fileURLToPath(new URL('../test/fixtures/', import.meta.url))
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
    const cwd = path.join(fixtureRoot, 'json-extends')
    const result = await getConfig({ configFile: 'oxlint-fixture.json', cwd })

    expect(result).not.toBeNull()
    expect(result?.files.map((file) => path.relative(cwd, file))).toEqual(['oxlint-fixture.json', 'base.json'])
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
    const cwd = path.join(fixtureRoot, 'jsonc-extends')
    const result = await getConfig({ cwd })

    expect(result).not.toBeNull()
    expect(path.basename(result?.filepath ?? '')).toBe('.oxlintrc.jsonc')
    expect(result?.files.map((file) => path.relative(cwd, file))).toEqual(['.oxlintrc.jsonc', 'base.jsonc'])
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
    const cwd = path.join(fixtureRoot, 'json-extends')
    const result = await getConfig({ configFile: 'base.json', cwd })

    expect(path.basename(result?.filepath ?? '')).toBe('base.json')
    expect(result?.config.rules).toEqual({
      eqeqeq: 'warn',
      'eslint/no-debugger': 'warn',
    })
  })

  test('loads TypeScript config with inline extends', async () => {
    const cwd = path.join(fixtureRoot, 'ts-inline')
    const result = await getConfig({ configFile: 'oxlint-fixture.config.ts', cwd })

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

  test('loads TypeScript config with file-based extends', async () => {
    const cwd = path.join(fixtureRoot, 'ts-extends')
    const result = await getConfig({ configFile: 'oxlint-fixture.config.ts', cwd })

    expect(result).not.toBeNull()
    expect(result?.files.map((file) => path.relative(cwd, file))).toEqual(['oxlint-fixture.config.ts'])
    expect(result?.config).toMatchObject({
      env: {
        browser: true,
      },
      overrides: [
        {
          files: ['**/*.ts'],
          rules: {
            'typescript/no-explicit-any': 'error',
          },
        },
      ],
      plugins: ['typescript', 'react'],
      rules: {
        'base/rule': 'warn',
        'own/rule': 'error',
      },
    })
    expect(result?.config).not.toHaveProperty('categories')
    expect(result?.config).not.toHaveProperty('jsPlugins')
  })

  test('throws for circular JSON extends', async () => {
    const cwd = path.join(fixtureRoot, 'circular')

    await expect(getConfig({ configFile: 'oxlint-fixture.json', cwd })).rejects.toThrow(
      'Circular Oxlint config extends detected',
    )
  })

  test('returns null when no config is found', async () => {
    const cwd = path.join(fixtureRoot, 'empty')

    await expect(getConfig({ cwd })).resolves.toBeNull()
  })

  test('loads Oxlint config from vite.config.ts lint block', async () => {
    const cwd = path.join(fixtureRoot, 'vite-plus')
    const result = await getConfig({ cwd })

    expect(result).not.toBeNull()
    expect(path.basename(result?.filepath ?? '')).toBe('vite.config.ts')
    expect(result?.config).toMatchObject({
      jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
      options: { typeAware: true, typeCheck: true },
      rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    })
    expect(result?.config).not.toHaveProperty('staged')
    expect(result?.config).not.toHaveProperty('fmt')
    expect(result?.config).not.toHaveProperty('run')
  })

  test('returns null when vite.config.ts has no lint block', async () => {
    const cwd = path.join(fixtureRoot, 'vite-plus-no-lint')

    await expect(getConfig({ cwd })).resolves.toBeNull()
  })

  test('prefers vite.config.ts over dedicated Oxlint config', async () => {
    const cwd = path.join(fixtureRoot, 'vite-plus-priority')
    const result = await getConfig({ cwd })

    expect(path.basename(result?.filepath ?? '')).toBe('vite.config.ts')
    expect(result?.config.rules).toEqual({ 'no-console': 'error' })
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
