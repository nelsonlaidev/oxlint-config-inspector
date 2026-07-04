import type { ExternalPluginEntry } from 'oxlint'
import type { LoadedOxlintConfig } from './config'

import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

type PluginModule = {
  default?: unknown
}

type JsPlugin = {
  meta?: {
    name?: string
  }
  rules?: Record<string, JsPluginRuleDefinition>
}

type JsPluginRuleDefinition = {
  meta?: unknown
}

type PluginRuleInfo = {
  /** The rule's own metadata (e.g. schema, deprecation info). */
  meta?: unknown
  /** The rule name as exported by the plugin (without prefix). */
  name: string
  /** The plugin name this rule belongs to. */
  pluginName: string
  /** The fully-qualified rule ID, e.g. `"my-plugin/my-rule"`. */
  ruleId: string
}

/**
 * Information about a successfully loaded JS plugin.
 */
export type PluginInfo = {
  name: string
  /** The resolved file path to the plugin module on disk. */
  resolvedPath: string
  rules: PluginRuleInfo[]
  /** The original specifier used to load the plugin (path or package name). */
  specifier: string
}

/**
 * Represents an error that occurred while loading a JS plugin entry.
 */
export type PluginLoadError = {
  message: string
  name?: string
  specifier: string
}

/**
 * The result of loading JS plugins from a config, including any failures.
 */
export type LoadedPlugins = {
  errors: PluginLoadError[]
  plugins: PluginInfo[]
}

type PluginLoadResult = PluginInfo | PluginLoadError

/**
 * Loads all JS plugins declared in the config (both root-level and override-level).
 *
 * Each plugin entry is imported dynamically. Failures are captured as
 * {@link PluginLoadError} rather than thrown, so partial success is possible.
 *
 * @param config - The loaded Oxlint config.
 * @returns All successfully loaded plugins and any load errors encountered.
 */
export async function getPlugins(config: LoadedOxlintConfig): Promise<LoadedPlugins> {
  const entries = getPluginEntries(config)
  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        return await loadPlugin(entry, config.filepath)
      } catch (error) {
        return createPluginLoadError(entry, error)
      }
    }),
  )
  const errors: PluginLoadError[] = []
  const plugins: PluginInfo[] = []

  for (const result of results) {
    if (isPluginLoadError(result)) {
      errors.push(result)
      continue
    }

    plugins.push(result)
  }

  return {
    errors,
    plugins,
  }
}

/**
 * Collects all unique JS plugin entries from root-level and override-level config, deduplicating by key.
 */
function getPluginEntries(config: LoadedOxlintConfig) {
  const entries = new Map<string, ExternalPluginEntry>()

  for (const entry of config.config.jsPlugins ?? []) {
    entries.set(getPluginEntryKey(entry), entry)
  }

  for (const override of config.config.overrides ?? []) {
    for (const entry of override.jsPlugins ?? []) {
      entries.set(getPluginEntryKey(entry), entry)
    }
  }

  return [...entries.values()]
}

/**
 * Computes a deduplication key for a plugin entry.
 *
 * String entries use the specifier itself as the key. Object entries use
 * `"name:specifier"` so that the same package loaded under a different alias
 * is treated as a distinct plugin.
 *
 * @param entry - The plugin entry (string specifier or object).
 * @returns A unique key string for deduplication.
 */
function getPluginEntryKey(entry: ExternalPluginEntry) {
  if (typeof entry === 'string') {
    return entry
  }

  return `${entry.name}:${entry.specifier}`
}

/**
 * Wraps an error thrown during plugin loading into a structured {@link PluginLoadError}.
 */
function createPluginLoadError(entry: ExternalPluginEntry, error: unknown): PluginLoadError {
  return {
    message: error instanceof Error ? error.message : String(error),
    name: typeof entry === 'string' ? undefined : entry.name,
    specifier: getPluginSpecifier(entry),
  }
}

/**
 * Type guard that discriminates {@link PluginLoadError} from {@link PluginInfo}.
 */
function isPluginLoadError(result: PluginLoadResult): result is PluginLoadError {
  return 'message' in result
}

/**
 * Resolves, imports, and extracts rule information from a single JS plugin entry.
 */
async function loadPlugin(entry: ExternalPluginEntry, configFilepath: string): Promise<PluginInfo> {
  const specifier = getPluginSpecifier(entry)
  const resolvedPath = resolvePluginPath(specifier, configFilepath)
  const plugin = await importPlugin(resolvedPath)
  const name = getPluginName(entry, specifier, plugin)
  const rules = getPluginRules(name, plugin)

  return {
    name,
    resolvedPath,
    rules,
    specifier,
  }
}

/**
 * Extracts the specifier (path or package name) from a plugin entry.
 */
function getPluginSpecifier(entry: ExternalPluginEntry) {
  if (typeof entry === 'string') {
    return entry
  }

  return entry.specifier
}

/**
 * Resolves a plugin specifier to an absolute file path.
 *
 * Handles three cases: `file:` URLs, relative/absolute path specifiers
 * (resolved against the config file directory), and bare package specifiers
 * (resolved via Node's module resolution).
 *
 * @param specifier - The plugin specifier string.
 * @param configFilepath - Absolute path to the config file declaring the plugin.
 * @returns The absolute file path to the plugin module.
 */
function resolvePluginPath(specifier: string, configFilepath: string) {
  if (specifier.startsWith('file:')) {
    return fileURLToPath(specifier)
  }

  if (isPathSpecifier(specifier)) {
    return path.resolve(path.dirname(configFilepath), specifier)
  }

  const resolvedUrl = import.meta.resolve(specifier, pathToFileURL(configFilepath).href)

  return fileURLToPath(resolvedUrl)
}

/**
 * Dynamically imports a plugin module and validates that it is a {@link JsPlugin}.
 *
 * @throws {TypeError} If the imported module is not a valid plugin object.
 */
async function importPlugin(resolvedPath: string): Promise<JsPlugin> {
  const namespace = (await import(pathToFileURL(resolvedPath).href)) as PluginModule
  const plugin = namespace.default ?? namespace

  if (!isJsPlugin(plugin)) {
    throw new TypeError(`Invalid Oxlint JS plugin: ${resolvedPath}`)
  }

  return plugin
}

/**
 * Type guard that checks whether a value is a non-null object (valid JS plugin).
 */
function isJsPlugin(value: unknown): value is JsPlugin {
  return typeof value === 'object' && value !== null
}

/**
 * Determines the plugin name based on the entry type and specifier.
 *
 * Priority:
 * 1. Object entry — uses the explicitly provided `name` (alias).
 * 2. Path specifier — uses `meta.name` from the plugin, falling back to the basename.
 * 3. Package specifier — normalizes the package name (strips `eslint-plugin-` prefix).
 */
function getPluginName(entry: ExternalPluginEntry, specifier: string, plugin: JsPlugin) {
  if (typeof entry !== 'string') {
    return entry.name
  }

  if (isPathSpecifier(specifier)) {
    return plugin.meta?.name ?? path.basename(specifier, path.extname(specifier))
  }

  return normalizePackagePluginName(specifier)
}

/**
 * Extracts rule definitions from a loaded plugin and wraps them with metadata.
 */
function getPluginRules(pluginName: string, plugin: JsPlugin) {
  const rules = plugin.rules ?? {}
  const infos: PluginRuleInfo[] = []

  for (const [name, rule] of Object.entries(rules)) {
    infos.push({
      meta: rule.meta,
      name,
      pluginName,
      ruleId: `${pluginName}/${name}`,
    })
  }

  return infos
}

/**
 * Returns `true` if the specifier looks like a local file path (starts with `./`, `../`, or `/`).
 */
function isPathSpecifier(specifier: string) {
  return specifier.startsWith('.') || specifier.startsWith('/')
}

/**
 * Derives a plugin name from a resolved npm package path.
 *
 * Strips the `eslint-plugin-` prefix and handles scoped packages
 * (e.g. `@scope/eslint-plugin-foo` becomes `@scope/foo`).
 */
function normalizePackagePluginName(specifier: string) {
  const packageName = specifier.split('/node_modules/').at(-1) ?? specifier

  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/')
    const scopedName = scope ?? packageName

    if (name === 'eslint-plugin') {
      return scopedName
    }

    if (!name) {
      return scopedName
    }

    return `${scopedName}/${name.replace(/^eslint-plugin-?/, '')}`
  }

  return packageName.replace(/^eslint-plugin-?/, '')
}
