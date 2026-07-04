export type InspectorTab = 'config-files' | 'overview' | 'overrides' | 'plugins' | 'rules'
export type RulePluginFilter = 'all' | (string & {})
export type RuleStateFilter = 'active' | 'all' | 'deprecated' | 'fixable' | 'recommended'
export type RuleUsageFilter = 'all' | 'error' | 'off' | 'off-only' | 'overloaded' | 'unused' | 'using' | 'warn'
