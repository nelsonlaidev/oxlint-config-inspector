import type { LoadedOxlintConfig } from './config'
import type { PluginInfo, PluginLoadError } from './plugins'
import type { RuleInfo } from './types'

import { describe, expect, test } from 'vitest'

import { inspectLoadedConfig } from './inspect'

const config: LoadedOxlintConfig = {
  config: {
    categories: {
      correctness: 'error',
    },
    overrides: [
      {
        files: ['**/*.ts'],
        rules: {
          'react-hooks/rules-of-hooks': 'error',
          'typescript-eslint/no-unused-vars': 'warn',
          'unknown/override-only': ['error', { flag: true }],
        },
      },
      {
        excludeFiles: ['legacy/generated/**'],
        files: ['legacy/**'],
        plugins: ['react'],
        rules: {
          'react/rules-of-hooks': 'off',
        },
      },
    ],
    plugins: ['typescript'],
    rules: {
      '@typescript-eslint/no-unused-vars': [2, { vars: 'all' }],
      'demo/valid': 'warn',
      'no-debugger': 'off',
      'unknown/root-off': 0,
    },
  },
  filepath: '/project/.oxlintrc.json',
  files: ['/project/.oxlintrc.json'],
}

const builtinRules: RuleInfo[] = [
  {
    category: 'pedantic',
    default: false,
    docs_url: 'https://example.com/accessor-pairs',
    fix: 'none',
    scope: 'eslint',
    type_aware: false,
    value: 'accessor-pairs',
  },
  {
    category: 'correctness',
    default: true,
    docs_url: 'https://example.com/no-debugger',
    fix: 'none',
    scope: 'eslint',
    type_aware: false,
    value: 'no-debugger',
  },
  {
    category: 'correctness',
    default: false,
    docs_url: 'https://example.com/no-unused-vars',
    fix: 'fix',
    scope: 'typescript',
    type_aware: true,
    value: 'no-unused-vars',
  },
  {
    category: 'correctness',
    default: false,
    docs_url: 'https://example.com/rules-of-hooks',
    fix: 'suggestion',
    scope: 'react',
    type_aware: false,
    value: 'rules-of-hooks',
  },
]

const plugins: PluginInfo[] = [
  {
    name: 'demo',
    resolvedPath: '/project/demo-plugin.mjs',
    rules: [
      {
        meta: {
          deprecated: {},
          docs: {
            description: 'Valid demo rule',
            recommended: true,
            requiresTypeChecking: true,
            url: 'https://example.com/demo/valid',
          },
          fixable: 'code',
          hasSuggestions: true,
          replacedBy: [
            {
              plugin: { name: 'demo' },
              rule: { name: 'better' },
            },
          ],
          type: 'problem',
        },
        name: 'valid',
        pluginName: 'demo',
        ruleId: 'demo/valid',
      },
    ],
    specifier: './demo-plugin.mjs',
  },
]

const pluginErrors: PluginLoadError[] = [
  {
    message: 'Cannot find package',
    specifier: 'missing-plugin',
  },
]

const defaultPluginRules: RuleInfo[] = [
  createCorrectnessRule('eslint', true),
  createCorrectnessRule('typescript', true),
  createCorrectnessRule('unicorn', true),
  createCorrectnessRule('oxc', true),
  createCorrectnessRule('react', false),
]

describe('inspectLoadedConfig', () => {
  test('enables the default Oxlint plugins when the root plugins field is omitted', () => {
    const emptyConfig: LoadedOxlintConfig = {
      config: {},
      filepath: '/project/.oxlintrc.json',
      files: ['/project/.oxlintrc.json'],
    }

    const result = inspectLoadedConfig(emptyConfig, defaultPluginRules, [], [])

    expect(getEnabledRuleIds(result.rules)).toEqual([
      'eslint/eslint-correctness',
      'oxc/oxc-correctness',
      'typescript/typescript-correctness',
      'unicorn/unicorn-correctness',
    ])
    expect(result.rules.filter((rule) => rule.used).every((rule) => rule.severityStates.includes('warn'))).toBe(true)
    expect(result.stats.enabledRules).toBe(4)
  })

  test('disables the default plugin scopes when the root plugins field is an empty array', () => {
    const emptyPluginsConfig: LoadedOxlintConfig = {
      config: {
        plugins: [],
      },
      filepath: '/project/.oxlintrc.json',
      files: ['/project/.oxlintrc.json'],
    }

    const result = inspectLoadedConfig(emptyPluginsConfig, defaultPluginRules, [], [])

    expect(getEnabledRuleIds(result.rules)).toEqual(['eslint/eslint-correctness'])
    expect(result.stats.enabledRules).toBe(1)
  })

  test('replaces the default plugin scopes with explicitly configured plugins', () => {
    const reactConfig: LoadedOxlintConfig = {
      config: {
        plugins: ['react'],
      },
      filepath: '/project/.oxlintrc.json',
      files: ['/project/.oxlintrc.json'],
    }

    const result = inspectLoadedConfig(reactConfig, defaultPluginRules, [], [])

    expect(getEnabledRuleIds(result.rules)).toEqual(['eslint/eslint-correctness', 'react/react-correctness'])
    expect(result.stats.enabledRules).toBe(2)
  })

  test('normalizes builtin aliases, plugin metadata, unknown rules, usage, and stats', () => {
    const result = inspectLoadedConfig(config, builtinRules, plugins, pluginErrors)

    expect(result.configFiles).toEqual(['/project/.oxlintrc.json'])
    expect(result.configFilepath).toBe('/project/.oxlintrc.json')
    expect(result.generatedAt).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(result.generatedAt))).toBe(false)
    expect(result.pluginErrors).toEqual(pluginErrors)

    const noDebugger = result.rules.find((rule) => rule.ruleId === 'eslint/no-debugger')
    expect(noDebugger).toMatchObject({
      aliases: ['eslint/no-debugger', 'no-debugger'],
      configured: {
        options: [],
        raw: 'off',
        ruleId: 'no-debugger',
        severity: 'off',
      },
      defaultSeverity: 'error',
      description: 'Checks for usage of the debugger statement.',
      overloaded: true,
      pluginName: 'eslint',
      severityStates: ['error', 'off'],
      source: 'builtin',
      usage: {
        category: true,
        overrideGroups: [],
        root: true,
      },
      used: true,
    })
    const accessorPairs = result.rules.find((rule) => rule.ruleId === 'eslint/accessor-pairs')
    expect(accessorPairs).toMatchObject({
      defaultOptions: {
        enforceForClassMembers: true,
        enforceForTSTypes: false,
        getWithoutSet: false,
        setWithoutGet: true,
      },
    })
    const tsRule = result.rules.find((rule) => rule.ruleId === 'typescript/no-unused-vars')
    expect(tsRule).toMatchObject({
      aliases: [
        'typescript/no-unused-vars',
        '@typescript-eslint/no-unused-vars',
        'typescript-eslint/no-unused-vars',
        'typescript_eslint/no-unused-vars',
      ],
      configured: {
        options: [{ vars: 'all' }],
        raw: [2, { vars: 'all' }],
        ruleId: '@typescript-eslint/no-unused-vars',
        severity: 'error',
      },
      defaultSeverity: 'error',
      overloaded: true,
      severityStates: ['error', 'warn'],
      typeAware: true,
      usage: {
        category: true,
        overrideGroups: [0],
        root: true,
      },
    })

    const reactRule = result.rules.find((rule) => rule.ruleId === 'react/rules-of-hooks')
    expect(reactRule).toMatchObject({
      aliases: ['react/rules-of-hooks', 'react-hooks/rules-of-hooks', 'react_hooks/rules-of-hooks'],
      hasSuggestions: true,
      severityStates: ['error', 'off'],
      usage: {
        category: true,
        overrideGroups: [0, 1],
        root: false,
      },
    })

    const pluginRule = result.rules.find((rule) => rule.ruleId === 'demo/valid')
    expect(pluginRule).toMatchObject({
      configured: {
        severity: 'warn',
      },
      deprecated: true,
      description: 'Valid demo rule',
      docsUrl: 'https://example.com/demo/valid',
      fixable: true,
      hasSuggestions: true,
      pluginName: 'demo',
      recommended: true,
      replacedBy: ['demo/better'],
      ruleType: 'problem',
      severityStates: ['warn'],
      source: 'js-plugin',
      typeAware: true,
    })

    const unknownRoot = result.rules.find((rule) => rule.ruleId === 'unknown/root-off')
    expect(unknownRoot).toMatchObject({
      defaultSeverity: 'unknown',
      offOnly: true,
      pluginName: 'unknown',
      severityStates: ['off'],
      source: 'unknown',
      used: true,
    })

    expect(result.overrideGroups).toEqual([
      {
        excludeFiles: undefined,
        files: ['**/*.ts'],
        index: 0,
        plugins: undefined,
        rules: [
          {
            options: [],
            raw: 'error',
            ruleId: 'react/rules-of-hooks',
            severity: 'error',
            source: 'builtin',
          },
          {
            options: [],
            raw: 'warn',
            ruleId: 'typescript/no-unused-vars',
            severity: 'warn',
            source: 'builtin',
          },
          {
            options: [{ flag: true }],
            raw: ['error', { flag: true }],
            ruleId: 'unknown/override-only',
            severity: 'error',
            source: 'unknown',
          },
        ],
      },
      {
        excludeFiles: ['legacy/generated/**'],
        files: ['legacy/**'],
        index: 1,
        plugins: ['react'],
        rules: [
          {
            options: [],
            raw: 'off',
            ruleId: 'react/rules-of-hooks',
            severity: 'off',
            source: 'builtin',
          },
        ],
      },
    ])

    expect(result.plugins).toEqual([
      {
        name: 'eslint',
        ruleCount: 2,
        source: 'builtin',
      },
      {
        name: 'react',
        ruleCount: 1,
        source: 'builtin',
      },
      {
        name: 'typescript',
        ruleCount: 1,
        source: 'builtin',
      },
      {
        name: 'demo',
        ruleCount: 1,
        source: 'js-plugin',
        specifier: './demo-plugin.mjs',
      },
    ])
    expect(result.rulePluginFilters).toEqual(['all', 'demo', 'eslint', 'react', 'typescript', 'unknown'])
    expect(result.unknownRules.map((rule) => rule.ruleId)).toEqual(['unknown/override-only', 'unknown/root-off'])
    expect(result.stats).toEqual({
      builtinRules: 4,
      configuredRules: 4,
      deprecatedRules: 1,
      enabledRules: 5,
      fixableRules: 2,
      jsPluginRules: 1,
      overrideRules: 3,
      recommendedRules: 2,
      totalRules: 7,
      unknownRules: 2,
    })
  })
})

function createCorrectnessRule(scope: string, enabledByDefault: boolean): RuleInfo {
  return {
    category: 'correctness',
    default: enabledByDefault,
    docs_url: `https://example.com/${scope}-correctness`,
    fix: 'none',
    scope,
    type_aware: false,
    value: `${scope}-correctness`,
  }
}

function getEnabledRuleIds(rules: ReturnType<typeof inspectLoadedConfig>['rules']) {
  return rules.filter((rule) => rule.used).map((rule) => rule.ruleId)
}
