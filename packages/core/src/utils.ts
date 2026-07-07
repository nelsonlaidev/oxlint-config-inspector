import type { RuleInfo } from './types'

/** Type guard that checks whether a value is a non-null object (record). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Returns the string value if it is a string, or `undefined` otherwise. */
export function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

/** Returns the boolean value if it is a boolean, or `undefined` otherwise. */
export function getBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

type ScopeConfig = {
  /** Canonical plugin prefix used by Oxlint for this internal rule scope. */
  pluginName: string
  /** Additional accepted rule prefixes that should resolve to the same builtin rule. */
  prefixAliases?: string[]
}

/**
 * Maps oxlint's internal rule scopes to user-facing plugin prefixes and known
 * compatibility aliases accepted by oxlint.
 *
 * This mirrors the plugin scope normalization in Oxlint so rules configured
 * with aliases like `@typescript-eslint/no-unused-vars`,
 * `react-hooks/rules-of-hooks`, or `deepscan/no-...` resolve to the same
 * builtin catalog entries as their canonical Oxlint rule IDs.
 *
 * @see https://github.com/oxc-project/oxc/blob/f30a64c2/crates/oxc_linter/src/config/plugins.rs#L150-L184
 */
export const SCOPE_CONFIG: Record<string, ScopeConfig> = {
  import: { pluginName: 'import', prefixAliases: ['import-x'] },
  jsx_a11y: { pluginName: 'jsx-a11y', prefixAliases: ['jsx_a11y', 'jsx-a11y-x', 'jsx_a11y-x'] },
  oxc: { pluginName: 'oxc', prefixAliases: ['deepscan'] },
  react: { pluginName: 'react', prefixAliases: ['react-hooks', 'react_hooks'] },
  react_perf: { pluginName: 'react-perf', prefixAliases: ['react_perf'] },
  typescript: {
    pluginName: 'typescript',
    prefixAliases: ['@typescript-eslint', 'typescript-eslint', 'typescript_eslint'],
  },
}

/**
 * Resolves an Oxlint internal scope name to its canonical user-facing plugin prefix.
 *
 * @param scope - The internal scope name from Oxlint.
 * @returns The canonical plugin prefix, or the scope itself if no mapping exists.
 */
export function getPluginName(scope: string): string {
  return SCOPE_CONFIG[scope]?.pluginName ?? scope
}

/**
 * Constructs a fully-qualified rule ID from an Oxlint rule's scope and value.
 *
 * @param rule - The rule info from Oxlint.
 * @returns The fully-qualified rule ID (e.g. `"eslint/no-debugger"`).
 */
export function getBuiltinRuleId(rule: RuleInfo): string {
  return `${getPluginName(rule.scope)}/${rule.value}`
}
