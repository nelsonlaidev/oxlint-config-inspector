import type { InspectedOverrideGroup, InspectedRule, RuleSeverity } from '@oxlint-config-inspector/core'

type RuleUsageConfig = {
  excludeFiles?: string[]
  files?: string[]
  index?: number
  options: unknown[]
  raw?: unknown
  ruleId: string
  severity: RuleSeverity
  source: 'category' | 'override' | 'root'
}

/**
 * Creates display-ready usage entries for a rule from compact usage references.
 *
 * @param rule - The inspected rule to derive usage entries for.
 * @param overrideGroups - Override groups used to resolve override usage indexes.
 * @returns Usage entries for default, root, and override configuration.
 */
export function createRuleUsageConfigs(
  rule: InspectedRule,
  overrideGroups: InspectedOverrideGroup[],
): RuleUsageConfig[] {
  const configs: RuleUsageConfig[] = []

  if (rule.usage.category) {
    configs.push({
      options: [],
      ruleId: rule.ruleId,
      severity: rule.defaultSeverity,
      source: 'category',
    })
  }

  if (rule.usage.root && rule.configured) {
    configs.push({
      options: rule.configured.options,
      raw: rule.configured.raw,
      ruleId: rule.configured.ruleId,
      severity: rule.configured.severity,
      source: 'root',
    })
  }

  for (const index of rule.usage.overrideGroups) {
    const overrideGroup = overrideGroups.find((group) => group.index === index)
    const overrideRule = overrideGroup?.rules.find((overrideRule) => overrideRule.ruleId === rule.ruleId)

    if (!overrideGroup || !overrideRule) {
      continue
    }

    configs.push({
      excludeFiles: overrideGroup.excludeFiles,
      files: overrideGroup.files,
      index,
      options: overrideRule.options,
      raw: overrideRule.raw,
      ruleId: overrideRule.ruleId,
      severity: overrideRule.severity,
      source: 'override',
    })
  }

  return configs
}

export function getUsageLocation(config: ReturnType<typeof createRuleUsageConfigs>[number]) {
  if (config.source === 'override') {
    return `override #${config.index}`
  }

  if (config.source === 'root') {
    return 'root config'
  }

  return 'category config'
}
