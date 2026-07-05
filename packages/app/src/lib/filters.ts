import type { InspectedRule } from '@oxlint-config-inspector/core'
import type { IFuseOptions } from 'fuse.js'
import type { RulePluginFilter, RuleStateFilter, RuleUsageFilter } from '../types'

import Fuse from 'fuse.js'

export const RULE_STATE_FILTERS: RuleStateFilter[] = ['all', 'active', 'recommended', 'fixable', 'deprecated']
export const RULE_USAGE_FILTERS: RuleUsageFilter[] = [
  'all',
  'using',
  'unused',
  'error',
  'warn',
  'off',
  'overloaded',
  'off-only',
]

const RULE_SEARCH_OPTIONS: IFuseOptions<InspectedRule> = {
  ignoreLocation: true,
  keys: [
    { name: 'ruleId', weight: 0.45 },
    { name: 'aliases', weight: 0.25 },
    { name: 'name', weight: 0.15 },
    { name: 'pluginName', weight: 0.1 },
    { name: 'category', weight: 0.1 },
    { name: 'description', weight: 0.05 },
    { name: 'source', weight: 0.05 },
    { name: 'ruleType', weight: 0.05 },
    { name: 'replacedBy', weight: 0.05 },
  ],
  threshold: 0.4,
}

export function filterRules(
  rules: InspectedRule[],
  filters: {
    pluginFilter: RulePluginFilter
    query: string
    stateFilter: RuleStateFilter
    usageFilter: RuleUsageFilter
  },
) {
  const { pluginFilter, query, stateFilter, usageFilter } = filters
  const normalizedQuery = query.trim().toLowerCase()

  const filteredRules = rules.filter((rule) => matchesRuleFilters(rule, { pluginFilter, stateFilter, usageFilter }))

  if (normalizedQuery.length === 0) {
    return filteredRules
  }

  return new Fuse(filteredRules, RULE_SEARCH_OPTIONS).search(normalizedQuery).map((result) => result.item)
}

function matchesRuleFilters(
  rule: InspectedRule,
  filters: {
    pluginFilter: RulePluginFilter
    stateFilter: RuleStateFilter
    usageFilter: RuleUsageFilter
  },
) {
  const { pluginFilter, stateFilter, usageFilter } = filters

  if (pluginFilter !== 'all' && rule.pluginName !== pluginFilter) {
    return false
  }

  if (!matchesUsageFilter(rule, usageFilter)) {
    return false
  }

  if (!matchesStateFilter(rule, stateFilter)) {
    return false
  }

  return true
}

function matchesUsageFilter(rule: InspectedRule, filter: RuleUsageFilter) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'using') {
    return rule.used
  }

  if (filter === 'unused') {
    return !rule.used
  }

  if (filter === 'overloaded') {
    return rule.overloaded
  }

  if (filter === 'off-only') {
    return rule.offOnly
  }

  return rule.severityStates.includes(filter)
}

function matchesStateFilter(rule: InspectedRule, filter: RuleStateFilter) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'active') {
    return !rule.deprecated
  }

  if (filter === 'recommended') {
    return rule.recommended
  }

  if (filter === 'fixable') {
    return rule.fixable
  }

  return rule.deprecated
}
