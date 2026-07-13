import type { RuleCategories } from 'oxlint'
import type { GetConfigOptions, LoadedOxlintConfig } from './config'
import type { PluginInfo, PluginLoadError } from './plugins'
import type { RuleInfo } from './types'

import pkgJson from '../package.json'
import { getConfig } from './config'
import { builtinRuleDocs } from './generated/builtin-rule-docs'
import { getPlugins } from './plugins'
import { getOxlintRules } from './rules'
import { getBoolean, getBuiltinRuleId, getPluginName, getString, isRecord, SCOPE_CONFIG } from './utils'

/**
 * Origin of a plugin entry discovered during config inspection.
 */
export type InspectedPluginSource = 'builtin' | 'js-plugin'

/**
 * Summary information about a builtin or JS plugin discovered during config inspection.
 */
export type InspectedPlugin = {
  /** Number of rules exported by the plugin. */
  ruleCount: number
  /** The plugin name used as the rule prefix. */
  name: string
  /** The original specifier used to load the JS plugin (path or package name). */
  specifier?: string
  /** Whether this is an Oxlint builtin plugin scope or a loaded JS plugin. */
  source: InspectedPluginSource
}

/**
 * Error information for a JS plugin that failed to load during config inspection.
 */
export type InspectedPluginLoadError = PluginLoadError

/**
 * Normalized severity for a configured or cataloged Oxlint rule.
 */
export type RuleSeverity = 'error' | 'warn' | 'off' | 'unknown'

/**
 * Origin of a rule discovered during config inspection.
 */
export type InspectedRuleSource = 'builtin' | 'js-plugin' | 'unknown'

/**
 * ESLint-compatible rule type, when supplied by JS plugin metadata.
 */
export type InspectedRuleType = 'layout' | 'problem' | 'suggestion'

/**
 * Normalized severity state used by the inspector UI.
 */
export type InspectedRuleUsageSeverity = 'error' | 'warn' | 'off'

/**
 * Normalized representation of a rule entry from an Oxlint config.
 */
export type InspectedRuleConfig = {
  /** Rule options after the severity tuple item, or an empty array when none are configured. */
  options: unknown[]
  /** The original unmodified config value for the rule. */
  raw: unknown
  /** The rule ID exactly as it appeared in the config entry. */
  ruleId: string
  /** The normalized severity parsed from the config value. */
  severity: RuleSeverity
}

/**
 * Aggregate counts derived from inspected rules.
 */
export type InspectConfigStats = {
  /** Number of builtin rules known to the inspector. */
  builtinRules: number
  /** Number of rules configured at the root config level. */
  configuredRules: number
  /** Number of deprecated rules known to the inspector. */
  deprecatedRules: number
  /** Number of rules enabled by default, root config, or override config. */
  enabledRules: number
  /** Number of rules that can apply an automatic fix. */
  fixableRules: number
  /** Number of JS plugin rules known to the inspector. */
  jsPluginRules: number
  /** Number of rules configured in one or more override blocks. */
  overrideRules: number
  /** Number of rules that belong to a recommended rule set. */
  recommendedRules: number
  /** Total number of builtin, JS plugin, and unknown rules known to the inspector. */
  totalRules: number
  /** Number of configured rules that were not found in the builtin catalog or loaded JS plugins. */
  unknownRules: number
}

/**
 * Compact usage references for category, root, and override configuration.
 */
export type InspectedRuleUsage = {
  /** Whether this rule is enabled by a category-level severity config. */
  category: boolean
  /** Override group indexes that configure this rule. */
  overrideGroups: number[]
  /** Whether this rule is configured at the root config level. */
  root: boolean
}

/**
 * A builtin, JS plugin, or unknown rule with its catalog metadata and config state.
 */
export type InspectedRule = {
  /** Rule IDs that resolve to this rule, including compatibility aliases. */
  aliases: string[]
  /** Oxlint category for builtin rules, when available. */
  category?: string
  /** Root-level config applied to this rule, when configured. */
  configured?: InspectedRuleConfig
  /** Severity implied by the rule catalog before user configuration is applied. */
  defaultSeverity: RuleSeverity
  /** Documented default option values, when available. */
  defaultOptions?: Record<string, unknown>
  /** Human-readable rule description from ESLint-compatible rule metadata, when available. */
  description?: string
  /** Whether the rule is deprecated. */
  deprecated: boolean
  /** Documentation URL for builtin rules, when available. */
  docsUrl?: string
  /** Whether the rule can apply an automatic fix. */
  fixable: boolean
  /** Whether the rule can provide editor suggestions. */
  hasSuggestions: boolean
  /** Rule metadata provided by a JS plugin rule, when available. */
  meta?: unknown
  /** Rule name without the plugin prefix. */
  name: string
  /** Whether this rule is configured but explicitly turned off everywhere. */
  offOnly: boolean
  /** Whether this rule has more than one normalized usage severity. */
  overloaded: boolean
  /** Plugin or scope name for the rule, when the rule ID has one. */
  pluginName?: string
  /** Whether the rule belongs to the recommended/default-enabled rule set. */
  recommended: boolean
  /** Replacement rule IDs or names declared by deprecation metadata. */
  replacedBy: string[]
  /** Canonical rule ID used by the inspector. */
  ruleId: string
  /** Unique normalized severities present on this rule, ordered as error, warn, then off. */
  severityStates: InspectedRuleUsageSeverity[]
  /** ESLint-compatible rule type, when available. */
  ruleType?: InspectedRuleType
  /** Source that supplied this rule. */
  source: InspectedRuleSource
  /** Whether a builtin rule requires type information, when available. */
  typeAware?: boolean
  /** Compact usage references for default, root, and override configuration. */
  usage: InspectedRuleUsage
  /** Whether this rule is used by default, root config, or override config. */
  used: boolean
}

/**
 * A rule entry grouped under a config override block.
 */
export type InspectedOverrideGroupRule = {
  /** Rule options after the severity tuple item, or an empty array when none are configured. */
  options: unknown[]
  /** The original unmodified config value for the rule. */
  raw: unknown
  /** Canonical rule ID used by the inspector. */
  ruleId: string
  /** Normalized severity parsed from the override config value. */
  severity: RuleSeverity
  /** Source that supplied this rule. */
  source: InspectedRuleSource
}

/**
 * A normalized config override block.
 */
export type InspectedOverrideGroup = {
  /** File globs excluded by the override, when configured. */
  excludeFiles?: string[]
  /** File globs included by the override. */
  files: string[]
  /** Zero-based position of the override in the resolved config. */
  index: number
  /** Plugins enabled by this override block. */
  plugins?: string[]
  /** Rules configured by this override block. */
  rules: InspectedOverrideGroupRule[]
}

/**
 * Complete inspection result for a resolved Oxlint config.
 */
export type InspectConfigResult = {
  /** Every config file visited while resolving `extends`. */
  configFiles: string[]
  /** Absolute path to the root config file that was inspected. */
  configFilepath: string
  /** ISO 8601 timestamp for when this inspection result was generated. */
  generatedAt: string
  /** Override blocks from the resolved config, including blocks without rule configs. */
  overrideGroups: InspectedOverrideGroup[]
  /** JS plugin load errors encountered during inspection. */
  pluginErrors: InspectedPluginLoadError[]
  /** Builtin plugin scopes and JS plugins discovered during inspection. */
  plugins: InspectedPlugin[]
  /** Available plugin filter values derived from inspected rules. */
  rulePluginFilters: string[]
  /** All builtin, JS plugin, and unknown rules known to the inspector. */
  rules: InspectedRule[]
  /** Aggregate counts derived from inspected rules. */
  stats: InspectConfigStats
  /** Configured rules that were not found in the builtin catalog or loaded JS plugins. */
  unknownRules: InspectedRule[]
  /** The inspector package version that produced this result. */
  version: string
}

type RuleCatalog = {
  aliasesByRuleId: Map<string, Set<string>>
  ruleIdByAlias: Map<string, string>
  rulesById: Map<string, InspectedRule>
}

/**
 * Loads an Oxlint config and returns an inspection model for its rules and JS plugins.
 *
 * @param options - See {@link GetConfigOptions}.
 * @returns The inspected config result, or `null` if no config file is found.
 */
export async function inspectConfig(options: GetConfigOptions = {}): Promise<InspectConfigResult | null> {
  const config = await getConfig(options)

  if (!config) {
    return null
  }

  const isVitePlus = config.filepath.endsWith('vite.config.ts')
  const [builtinRules, loadedPlugins] = await Promise.all([
    getOxlintRules({ useVitePlus: isVitePlus }),
    getPlugins(config),
  ])

  return inspectLoadedConfig(config, builtinRules, loadedPlugins.plugins, loadedPlugins.errors)
}

/**
 * Builds an inspection model from an already loaded config and precomputed rule catalogs.
 *
 * @param config - The resolved Oxlint config to inspect.
 * @param builtinRules - Builtin Oxlint rules to include in the catalog.
 * @param plugins - Successfully loaded JS plugins to include in the catalog.
 * @param pluginErrors - JS plugin load errors to surface in the inspection result.
 * @returns The inspected config result.
 */
export function inspectLoadedConfig(
  config: LoadedOxlintConfig,
  builtinRules: RuleInfo[],
  plugins: PluginInfo[],
  pluginErrors: PluginLoadError[],
): InspectConfigResult {
  const enabledPlugins = [
    ...(config.config.plugins ?? []),
    ...(config.config.overrides?.flatMap((o) => o.plugins ?? []) ?? []),
  ]

  const catalog = createRuleCatalog(builtinRules, plugins, enabledPlugins, config.config.categories)

  applyConfiguredRules(catalog, config.config.rules)

  const overrideGroups = createInspectedOverrideGroups(catalog, config.config.overrides)
  const overrideSeveritiesByRuleId = createOverrideSeveritiesByRuleId(overrideGroups)

  const rules = [...catalog.rulesById.values()]
    .map((rule) => {
      const usage = createRuleUsageSummary(rule, overrideSeveritiesByRuleId.get(rule.ruleId) ?? [])

      const aliases = [...(catalog.aliasesByRuleId.get(rule.ruleId) ?? [])]
      return {
        ...rule,
        ...usage,
        aliases,
      }
    })
    .toSorted((left, right) => left.ruleId.localeCompare(right.ruleId))

  return {
    configFiles: config.files,
    configFilepath: config.filepath,
    generatedAt: new Date().toISOString(),
    overrideGroups,
    pluginErrors,
    plugins: createInspectedPlugins(plugins, rules),
    rulePluginFilters: createRulePluginFilters(rules),
    rules,
    stats: createInspectConfigStats(rules),
    unknownRules: rules.filter((rule) => rule.source === 'unknown'),
    version: pkgJson.version,
  }
}

function createInspectConfigStats(rules: InspectedRule[]): InspectConfigStats {
  return {
    builtinRules: rules.filter((rule) => rule.source === 'builtin').length,
    configuredRules: rules.filter((rule) => rule.configured).length,
    deprecatedRules: rules.filter((rule) => rule.deprecated).length,
    enabledRules: rules.filter((rule) => rule.severityStates.some((severity) => severity !== 'off')).length,
    fixableRules: rules.filter((rule) => rule.fixable).length,
    jsPluginRules: rules.filter((rule) => rule.source === 'js-plugin').length,
    overrideRules: rules.filter((rule) => rule.usage.overrideGroups.length > 0).length,
    recommendedRules: rules.filter((rule) => rule.recommended).length,
    totalRules: rules.length,
    unknownRules: rules.filter((rule) => rule.source === 'unknown').length,
  }
}

function createRulePluginFilters(rules: InspectedRule[]): string[] {
  const pluginNames = new Set<string>()

  for (const rule of rules) {
    if (rule.pluginName) {
      pluginNames.add(rule.pluginName)
    }
  }

  return ['all', ...[...pluginNames].toSorted((left, right) => left.localeCompare(right))]
}

function createInspectedOverrideGroups(
  catalog: RuleCatalog,
  overrides: LoadedOxlintConfig['config']['overrides'],
): InspectedOverrideGroup[] {
  const groups: InspectedOverrideGroup[] = []

  for (const [index, override] of overrides?.entries() ?? []) {
    const group: InspectedOverrideGroup = {
      excludeFiles: override.excludeFiles,
      files: override.files,
      index,
      plugins: override.plugins,
      rules: [],
    }

    if (override.rules) {
      for (const [ruleId, raw] of Object.entries(override.rules)) {
        const normalizedRuleId = getNormalizedRuleId(catalog, ruleId)
        const rule = getOrCreateUnknownRule(catalog, normalizedRuleId, ruleId)
        const config = createRuleConfig(ruleId, raw)

        rule.usage.overrideGroups.push(index)
        group.rules.push({
          options: config.options,
          raw: config.raw,
          ruleId: rule.ruleId,
          severity: config.severity,
          source: rule.source,
        })
      }
    }

    groups.push(group)
  }

  return groups
}

function createOverrideSeveritiesByRuleId(overrideGroups: InspectedOverrideGroup[]) {
  const severitiesByRuleId = new Map<string, RuleSeverity[]>()

  for (const group of overrideGroups) {
    for (const rule of group.rules) {
      const severities = severitiesByRuleId.get(rule.ruleId) ?? []
      severities.push(rule.severity)
      severitiesByRuleId.set(rule.ruleId, severities)
    }
  }

  return severitiesByRuleId
}

function createInspectedPlugins(plugins: PluginInfo[], rules: InspectedRule[]): InspectedPlugin[] {
  const inspectedPlugins = new Map<string, InspectedPlugin>()

  for (const rule of rules) {
    if (!rule.pluginName || rule.source === 'unknown') {
      continue
    }

    const key = `${rule.source}:${rule.pluginName}`
    const inspectedPlugin = inspectedPlugins.get(key) ?? {
      name: rule.pluginName,
      ruleCount: 0,
      source: rule.source,
    }

    inspectedPlugin.ruleCount += 1
    inspectedPlugins.set(key, inspectedPlugin)
  }

  for (const plugin of plugins) {
    const key = `js-plugin:${plugin.name}`
    const inspectedPlugin = inspectedPlugins.get(key) ?? {
      name: plugin.name,
      ruleCount: plugin.rules.length,
      source: 'js-plugin',
    }

    inspectedPlugins.set(key, {
      ...inspectedPlugin,
      specifier: plugin.specifier,
    })
  }

  return [...inspectedPlugins.values()].toSorted((left, right) => {
    if (left.source !== right.source) {
      return left.source.localeCompare(right.source)
    }

    return left.name.localeCompare(right.name)
  })
}

function createRuleCatalog(
  builtinRules: RuleInfo[],
  plugins: PluginInfo[],
  enabledPlugins: string[] | undefined,
  categories?: RuleCategories,
): RuleCatalog {
  const bareBuiltinRuleIds = createBareBuiltinRuleIds(builtinRules)
  const enabledPluginNames = new Set(['eslint', ...(enabledPlugins ?? [])])
  /**
   * When categories are not explicitly configured, Oxlint applies a default
   * severity of `warn` to all correctness rules via the `RulesBuilder` defaults.
   *
   * @see https://github.com/oxc-project/oxc/blob/f30a64c26971a7eef6b4dd1b42c0a947555f47c0/crates/oxc_linter/src/config/config_builder.rs#L47-L51
   */
  const implicitCategoryDefaults: Record<string, unknown> = {
    correctness: 'warn',
  }
  const catalog: RuleCatalog = {
    aliasesByRuleId: new Map(),
    ruleIdByAlias: new Map(),
    rulesById: new Map(),
  }

  for (const rule of builtinRules) {
    const ruleId = getBuiltinRuleId(rule)
    const pluginName = getPluginName(rule.scope)
    const isPluginEnabled = enabledPluginNames.has(pluginName)
    const userCategorySeverity = categories?.[rule.category as keyof RuleCategories]
    const resolvedCategorySeverity = userCategorySeverity ?? implicitCategoryDefaults[rule.category]
    const useCategorySeverity = resolvedCategorySeverity !== undefined && isPluginEnabled
    const defaultSeverity = useCategorySeverity
      ? getRuleSeverity(resolvedCategorySeverity)
      : getDefaultSeverity(rule.default)

    const metadata = createBuiltinRuleMetadata(rule)

    catalog.rulesById.set(ruleId, {
      aliases: [],
      category: rule.category,
      defaultSeverity,
      ...metadata,
      name: rule.value,
      ...createEmptyRuleUsage(isPluginEnabled && useCategorySeverity),
      pluginName,
      ruleId,
      source: 'builtin',
      typeAware: rule.type_aware,
    })

    addAliases(catalog, ruleId, getBuiltinRuleAliases(rule, ruleId, bareBuiltinRuleIds))
  }

  for (const plugin of plugins) {
    for (const rule of plugin.rules) {
      const metadata = createPluginRuleMetadata(rule.meta)

      catalog.rulesById.set(rule.ruleId, {
        aliases: [],
        defaultSeverity: 'off',
        ...metadata,
        meta: rule.meta,
        name: rule.name,
        ...createEmptyRuleUsage(false),
        pluginName: plugin.name,
        ruleId: rule.ruleId,
        source: 'js-plugin',
      })

      addAliases(catalog, rule.ruleId, [rule.ruleId])
    }
  }

  return catalog
}

function applyConfiguredRules(catalog: RuleCatalog, rules: Record<string, unknown> | undefined) {
  if (!rules) {
    return
  }

  for (const [ruleId, raw] of Object.entries(rules)) {
    const normalizedRuleId = getNormalizedRuleId(catalog, ruleId)
    const rule = getOrCreateUnknownRule(catalog, normalizedRuleId, ruleId)
    const configured = createRuleConfig(ruleId, raw)

    rule.configured = configured
    rule.usage.root = true
  }
}

function getOrCreateUnknownRule(catalog: RuleCatalog, normalizedRuleId: string, configuredRuleId: string) {
  const rule = catalog.rulesById.get(normalizedRuleId)

  if (rule) {
    return rule
  }

  const unknownRule: InspectedRule = {
    aliases: [],
    defaultSeverity: 'unknown',
    deprecated: false,
    fixable: false,
    hasSuggestions: false,
    name: getRuleName(configuredRuleId),
    ...createEmptyRuleUsage(false),
    pluginName: getConfiguredPluginName(configuredRuleId),
    recommended: false,
    replacedBy: [],
    ruleId: configuredRuleId,
    source: 'unknown',
  }

  catalog.rulesById.set(configuredRuleId, unknownRule)
  addAliases(catalog, configuredRuleId, [configuredRuleId])

  return unknownRule
}

function createRuleConfig(ruleId: string, raw: unknown): InspectedRuleConfig {
  return {
    options: getRuleOptions(raw),
    raw,
    ruleId,
    severity: getRuleSeverity(raw),
  }
}

function getRuleSeverity(raw: unknown): RuleSeverity {
  let severity = raw

  if (Array.isArray(raw)) {
    severity = (raw as unknown[])[0]
  }

  if (typeof severity === 'number') {
    if (severity === 0) {
      return 'off'
    }

    if (severity === 1) {
      return 'warn'
    }

    if (severity === 2) {
      return 'error'
    }

    return 'unknown'
  }

  if (typeof severity !== 'string') {
    return 'unknown'
  }

  if (severity === 'allow' || severity === 'off') {
    return 'off'
  }

  if (severity === 'deny' || severity === 'error') {
    return 'error'
  }

  if (severity === 'warn') {
    return severity
  }

  return 'unknown'
}

function getRuleOptions(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.slice(1)
}

function getDefaultSeverity(enabledByDefault: boolean): RuleSeverity {
  return enabledByDefault ? 'warn' : 'off'
}

type RuleUsageSummary = Pick<InspectedRule, 'offOnly' | 'overloaded' | 'severityStates' | 'used'>

function createRuleUsageSummary(rule: InspectedRule, overrideSeverities: RuleSeverity[]): RuleUsageSummary {
  const severities: InspectedRuleUsageSeverity[] = []

  if (rule.usage.category) {
    addUsageSeverity(severities, rule.defaultSeverity)
  }

  if (rule.configured) {
    addUsageSeverity(severities, rule.configured.severity)
  }

  for (const severity of overrideSeverities) {
    addUsageSeverity(severities, severity)
  }

  const severityStates = createSeverityStates(severities)
  const used = rule.usage.category || rule.usage.root || rule.usage.overrideGroups.length > 0

  return {
    offOnly: used && severityStates.every((severity) => severity === 'off'),
    overloaded: severityStates.length > 1,
    severityStates,
    used,
  }
}

function createEmptyRuleUsage(isCategory: boolean): RuleUsageSummary & Pick<InspectedRule, 'usage'> {
  return {
    offOnly: false,
    overloaded: false,
    severityStates: [],
    usage: {
      category: isCategory,
      overrideGroups: [],
      root: false,
    },
    used: false,
  }
}

function addUsageSeverity(severities: InspectedRuleUsageSeverity[], severity: RuleSeverity) {
  if (severity === 'unknown') {
    return
  }

  severities.push(severity)
}

function createSeverityStates(configs: InspectedRuleUsageSeverity[]) {
  const severities = new Set(configs)

  return (['error', 'warn', 'off'] satisfies InspectedRuleUsageSeverity[]).filter((severity) =>
    severities.has(severity),
  )
}

type NormalizedRuleMetadata = {
  defaultOptions?: Record<string, unknown>
  deprecated: boolean
  description?: string
  docsUrl?: string
  fixable: boolean
  hasSuggestions: boolean
  recommended: boolean
  replacedBy: string[]
  ruleType?: InspectedRuleType
  typeAware?: boolean
}

function createBuiltinRuleMetadata(rule: RuleInfo): NormalizedRuleMetadata {
  const docMetadata = builtinRuleDocs[getBuiltinRuleId(rule)]

  return {
    defaultOptions: docMetadata?.defaultOptions,
    deprecated: false,
    description: docMetadata?.description,
    docsUrl: rule.docs_url,
    fixable: isBuiltinRuleFixable(rule.fix),
    hasSuggestions: hasBuiltinRuleSuggestions(rule.fix),
    recommended: rule.default,
    replacedBy: [],
  }
}

function createPluginRuleMetadata(meta: unknown): NormalizedRuleMetadata {
  if (!isRecord(meta)) {
    return createEmptyRuleMetadata()
  }

  const docs = isRecord(meta.docs) ? meta.docs : undefined

  return {
    deprecated: isDeprecated(meta.deprecated),
    description: getString(docs?.description),
    docsUrl: getString(docs?.url),
    fixable: meta.fixable === 'code' || meta.fixable === 'whitespace',
    hasSuggestions: meta.hasSuggestions === true,
    recommended: docs?.recommended === true,
    replacedBy: getReplacementRuleNames(meta.replacedBy),
    ruleType: getRuleType(meta.type),
    typeAware: getBoolean(docs?.requiresTypeChecking),
  }
}

function createEmptyRuleMetadata(): NormalizedRuleMetadata {
  return {
    deprecated: false,
    fixable: false,
    hasSuggestions: false,
    recommended: false,
    replacedBy: [],
  }
}

function isDeprecated(value: unknown) {
  return value === true || isRecord(value)
}

function getReplacementRuleNames(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      return [item]
    }

    if (!isRecord(item)) {
      return []
    }

    const ruleName = getString(item.name) ?? getString(item.ruleName)

    if (ruleName) {
      return [ruleName]
    }

    const rule = isRecord(item.rule) ? item.rule : undefined
    const plugin = isRecord(item.plugin) ? item.plugin : undefined
    const nestedRuleName = getString(rule?.name)
    const nestedPluginName = getString(plugin?.name)

    if (nestedRuleName && nestedPluginName) {
      return [`${nestedPluginName}/${nestedRuleName}`]
    }

    if (nestedRuleName) {
      return [nestedRuleName]
    }

    return []
  })
}

function getRuleType(value: unknown): InspectedRuleType | undefined {
  if (value === 'layout' || value === 'problem' || value === 'suggestion') {
    return value
  }

  return undefined
}

function isBuiltinRuleFixable(fix: string) {
  return fix !== 'none' && fix !== 'pending' && fix.includes('fix')
}

function hasBuiltinRuleSuggestions(fix: string) {
  return fix.includes('suggestion')
}

function getNormalizedRuleId(catalog: RuleCatalog, ruleId: string) {
  return catalog.ruleIdByAlias.get(ruleId) ?? ruleId
}

function addAliases(catalog: RuleCatalog, ruleId: string, aliases: string[]) {
  let aliasSet = catalog.aliasesByRuleId.get(ruleId)

  if (!aliasSet) {
    aliasSet = new Set()
    catalog.aliasesByRuleId.set(ruleId, aliasSet)
  }

  for (const alias of aliases) {
    aliasSet.add(alias)

    if (!catalog.ruleIdByAlias.has(alias)) {
      catalog.ruleIdByAlias.set(alias, ruleId)
    }
  }
}

function createBareBuiltinRuleIds(rules: RuleInfo[]): Set<string> {
  return new Set(rules.filter((rule) => rule.scope === 'eslint').map((rule) => getBuiltinRuleId(rule)))
}

function getBuiltinRuleAliases(rule: RuleInfo, ruleId: string, bareRuleIds: Set<string>): string[] {
  const config = SCOPE_CONFIG[rule.scope]
  const aliases = [ruleId]

  if (bareRuleIds.has(ruleId)) {
    aliases.push(rule.value)
  }

  for (const prefix of config?.prefixAliases ?? []) {
    aliases.push(`${prefix}/${rule.value}`)
  }

  return aliases
}

function getRuleName(ruleId: string) {
  return ruleId.split('/').at(-1) ?? ruleId
}

function getConfiguredPluginName(ruleId: string) {
  const segments = ruleId.split('/')

  if (segments.length < 2) {
    return
  }

  if (ruleId.startsWith('@') && segments.length > 2) {
    return `${segments[0]}/${segments[1]}`
  }

  return segments[0]
}
