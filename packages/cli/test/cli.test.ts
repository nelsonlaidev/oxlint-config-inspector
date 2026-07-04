import type { InspectConfigResult } from '@oxlint-config-inspector/core'

import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { afterEach, describe, expect, test } from 'vitest'

const execFileAsync = promisify(execFile)
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const binPath = path.join(repoRoot, 'packages/cli/bin/oxlint-config-inspector.mjs')
const emptyFixtureCwd = path.join(repoRoot, 'packages/core/test/fixtures/empty')
const fixtureCwd = path.join(repoRoot, 'packages/core/test/fixtures/json-extends')
const temporaryDirectories: string[] = []

async function runCli(args: string[]) {
  return await execFileAsync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  })
}

async function runCliFailure(args: string[]) {
  try {
    const result = await runCli(args)

    throw new Error(`Expected CLI to fail, but it exited successfully with stdout: ${result.stdout}`)
  } catch (error) {
    if (isExecError(error)) {
      return error
    }

    throw error
  }
}

function parseInspectJson(stdout: string): InspectConfigResult {
  return JSON.parse(stdout) as InspectConfigResult
}

function relativePath(filepath: string) {
  return path.relative(fixtureCwd, filepath)
}

function isExecError(error: unknown): error is Error & { code: number; stderr: string; stdout: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'number' &&
    'stderr' in error &&
    typeof error.stderr === 'string' &&
    'stdout' in error &&
    typeof error.stdout === 'string'
  )
}

describe('inspect binary', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { force: true, recursive: true })
      }),
    )
  })

  test('prints inspect JSON for a fixture cwd', async () => {
    const { stderr, stdout } = await runCli(['inspect', '--config', 'oxlint-fixture.json', '--cwd', fixtureCwd])
    const result = parseInspectJson(stdout)

    expect(stderr).toBe('')
    expect(relativePath(result.configFilepath)).toBe('oxlint-fixture.json')
    expect(result.configFiles.map(relativePath).toSorted()).toEqual(['base.json', 'oxlint-fixture.json'])
    expect(result.stats.totalRules).toBeGreaterThan(0)
    expect(result.stats.configuredRules).toBeGreaterThanOrEqual(2)
    expect(result.rules.some((rule) => rule.ruleId === 'eslint/no-debugger')).toBe(true)
    expect(result.overrideGroups).toEqual([
      {
        files: ['**/*.js'],
        index: 0,
        rules: [
          {
            options: [],
            raw: 'warn',
            ruleId: 'eslint/no-alert',
            severity: 'warn',
            source: 'builtin',
          },
        ],
      },
      {
        files: ['**/*.ts'],
        index: 1,
        rules: [
          {
            options: [],
            raw: 'error',
            ruleId: 'typescript/no-explicit-any',
            severity: 'error',
            source: 'builtin',
          },
        ],
      },
    ])
  })

  test('writes inspect JSON to an output file', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'oxlint-config-inspector-'))
    temporaryDirectories.push(outputDirectory)

    const outputPath = path.join(outputDirectory, 'inspect.json')
    const { stderr, stdout } = await runCli([
      'inspect',
      '--config',
      'oxlint-fixture.json',
      '--cwd',
      fixtureCwd,
      '--output',
      outputPath,
      '--pretty',
      'false',
    ])
    const output = await readFile(outputPath, 'utf-8')
    const result = parseInspectJson(output)

    expect(stderr).toBe('')
    expect(stdout).toBe('')
    expect(output).not.toContain('\n  "')
    expect(relativePath(result.configFilepath)).toBe('oxlint-fixture.json')
    expect(result.configFiles.map(relativePath).toSorted()).toEqual(['base.json', 'oxlint-fixture.json'])
  })

  test('fails when no config is found', async () => {
    const error = await runCliFailure(['inspect', '--cwd', emptyFixtureCwd])

    expect(error.code).not.toBe(0)
    expect(error.stdout).toBe('')
    expect(error.stderr).toContain('No Oxlint config found')
  })

  test('shows help for the dev command', async () => {
    const { stderr, stdout } = await runCli(['dev', '--help'])

    expect(stderr).toBe('')
    expect(stdout).toContain('Run the development server')
    expect(stdout).toContain('--config')
    expect(stdout).toContain('--cwd')
    expect(stdout).toContain('--port')
  })

  test('shows help for the build command', async () => {
    const { stderr, stdout } = await runCli(['build', '--help'])

    expect(stderr).toBe('')
    expect(stdout).toContain('Build a static inspector site')
    expect(stdout).toContain('--config')
    expect(stdout).toContain('--cwd')
    expect(stdout).toContain('--out-dir')
    expect(stdout).toContain('--pretty')
  })

  test('builds a static inspector site', async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'oxlint-config-inspector-site-'))
    temporaryDirectories.push(outputDirectory)

    const { stderr, stdout } = await runCli([
      'build',
      '--config',
      'oxlint-fixture.json',
      '--cwd',
      fixtureCwd,
      '--out-dir',
      outputDirectory,
      '--pretty',
      'false',
    ])
    const indexHtml = await readFile(path.join(outputDirectory, 'index.html'), 'utf-8')
    const dataJson = await readFile(path.join(outputDirectory, 'data.json'), 'utf-8')
    const result = parseInspectJson(dataJson)

    expect(stderr).toBe('')
    expect(stdout).toContain(`Built inspector site to ${outputDirectory}`)
    expect(indexHtml).toContain('<div id="root"></div>')
    expect(dataJson).not.toContain('\n  "')
    expect(relativePath(result.configFilepath)).toBe('oxlint-fixture.json')
    expect(result.configFiles.map(relativePath).toSorted()).toEqual(['base.json', 'oxlint-fixture.json'])
  })
})
