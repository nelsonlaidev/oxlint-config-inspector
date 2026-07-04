import { describe, expect, test } from 'vitest'

import { getConfig } from './config'
import { getPlugins } from './plugins'

const fixtureRoot = new URL('../test/fixtures/', import.meta.url)

describe('getPlugins', () => {
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
})
