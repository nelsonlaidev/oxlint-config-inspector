import type { InspectConfigResult } from '@oxlint-config-inspector/core'

export function isInspectConfigResult(value: unknown): value is InspectConfigResult {
  if (!isRecord(value)) {
    return false
  }

  return (
    Array.isArray(value.configFiles) &&
    typeof value.configFilepath === 'string' &&
    typeof value.generatedAt === 'string' &&
    Array.isArray(value.overrideGroups) &&
    Array.isArray(value.pluginErrors) &&
    Array.isArray(value.plugins) &&
    value.plugins.every(isInspectedPlugin) &&
    Array.isArray(value.rulePluginFilters) &&
    Array.isArray(value.rules) &&
    isRecord(value.stats) &&
    Array.isArray(value.unknownRules)
  )
}

function isInspectedPlugin(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.ruleCount === 'number' &&
    (value.specifier === undefined || typeof value.specifier === 'string') &&
    (value.source === 'builtin' || value.source === 'js-plugin')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
