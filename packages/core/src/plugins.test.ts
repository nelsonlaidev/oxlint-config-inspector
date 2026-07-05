import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { getConfig } from './config'
import { getPlugins } from './plugins'

const fixtureRoot = new URL('../test/fixtures/', import.meta.url)
const temporaryDirectories: string[] = []

describe('getPlugins', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { force: true, recursive: true })
      }),
    )
  })

  test('loads, aliases, deduplicates, and reports JS plugin errors', async () => {
    const cwd = new URL('js-plugin/', fixtureRoot)
    const config = await getConfig({ configFile: 'oxlint-fixture.json', cwd: cwd.pathname })

    if (!config) {
      throw new Error('Expected fixture config to load')
    }

    const result = await getPlugins(config)

    expect(result.plugins).toHaveLength(2)
    expect(result.plugins.map((plugin) => plugin.name)).toEqual(['fixture', 'alias'])
    expect(result.plugins.map((plugin) => plugin.specifier)).toEqual(['./plugin.mjs', './plugin.mjs'])
    expect(result.plugins.map((plugin) => plugin.rules)).toEqual([
      [
        {
          meta: {
            docs: {
              description: 'Alpha rule',
            },
          },
          name: 'alpha',
          pluginName: 'fixture',
          ruleId: 'fixture/alpha',
        },
      ],
      [
        {
          meta: {
            docs: {
              description: 'Alpha rule',
            },
          },
          name: 'alpha',
          pluginName: 'alias',
          ruleId: 'alias/alpha',
        },
      ],
    ])
    expect(result.plugins.every((plugin) => plugin.resolvedPath.endsWith('/plugin.mjs'))).toBe(true)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain('Invalid Oxlint JS plugin')
    expect(result.errors[0]).toMatchObject({
      specifier: './invalid.mjs',
    })
  })

  test('loads bare JS plugin packages from the config directory', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'oxlint-config-inspector-plugins-'))
    temporaryDirectories.push(cwd)

    const pluginDirectory = path.join(cwd, 'node_modules/eslint-plugin-npx-demo')
    await mkdir(pluginDirectory, { recursive: true })
    await writeFile(
      path.join(pluginDirectory, 'package.json'),
      JSON.stringify({
        main: 'index.cjs',
        name: 'eslint-plugin-npx-demo',
      }),
    )
    await writeFile(
      path.join(pluginDirectory, 'index.cjs'),
      `module.exports = {
  rules: {
    beta: {
      meta: {
        docs: {
          description: 'Beta rule',
        },
      },
    },
  },
}
`,
    )
    await writeFile(
      path.join(cwd, '.oxlintrc.json'),
      JSON.stringify({
        jsPlugins: ['eslint-plugin-npx-demo'],
      }),
    )

    const config = await getConfig({ cwd })

    if (!config) {
      throw new Error('Expected temporary config to load')
    }

    const result = await getPlugins(config)

    expect(result.errors).toEqual([])
    expect(result.plugins).toHaveLength(1)
    expect(result.plugins[0]).toMatchObject({
      name: 'npx-demo',
      specifier: 'eslint-plugin-npx-demo',
    })
    expect(result.plugins[0]?.resolvedPath.endsWith('/node_modules/eslint-plugin-npx-demo/index.cjs')).toBe(true)
    expect(result.plugins[0]?.rules).toEqual([
      {
        meta: {
          docs: {
            description: 'Beta rule',
          },
        },
        name: 'beta',
        pluginName: 'npx-demo',
        ruleId: 'npx-demo/beta',
      },
    ])
  })
})
