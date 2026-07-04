import type { InspectedRule } from '@oxlint-config-inspector/core'
import type { RulePluginFilter, RuleStateFilter, RuleUsageFilter } from '../types'

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

  return rules.filter((rule) => {
    if (normalizedQuery.length > 0 && !rule.searchText.includes(normalizedQuery)) {
      return false
    }

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
  })
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
