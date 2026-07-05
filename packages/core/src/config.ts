import type { PublicExplorer } from 'cosmiconfig'
import type { ParseError } from 'jsonc-parser'
import type { OxlintConfig } from 'oxlint'

import path from 'node:path'

import { cosmiconfig, defaultLoaders } from 'cosmiconfig'
import { createJiti } from 'jiti'
import { parse, printParseErrorCode } from 'jsonc-parser'

type JsonOxlintConfig = Omit<OxlintConfig, 'extends'> & {
  extends?: string[]
}

type ConfigInput = Omit<OxlintConfig, 'extends'> & {
  extends?: Array<string | ConfigInput>
}

export type GetConfigOptions = {
  /** Whether to cache discovered and loaded config files. Defaults to `true`. */
  cache?: boolean
  /** An explicit path to the config file. When provided, cosmiconfig loads this file directly instead of searching. */
  configFile?: string
  /** The directory to search for a config file. Defaults to `process.cwd()`. */
  cwd?: string
}

/**
 * An Oxlint config with all `extends` resolved and the field removed.
 */
type ResolvedOxlintConfig = Omit<OxlintConfig, 'extends'>

/**
 * The result of loading and resolving a config file from disk.
 */
export type LoadedOxlintConfig = {
  config: ResolvedOxlintConfig
  /** Every config file visited during resolution (including extended files). */
  files: string[]
  /** Absolute path to the root config file. */
  filepath: string
}

/** Known Oxlint config file names, searched in order by cosmiconfig. */
export const searchPlaces = ['.oxlintrc.json', '.oxlintrc.jsonc', 'oxlint.config.ts']

function createExplorer(cache: boolean) {
  const loadTs = createTypeScriptLoader(cache)

  return cosmiconfig('oxlint', {
    cache,
    loaders: {
      ...defaultLoaders,
      '.jsonc': loadJsonc,
      '.ts': loadTs,
    },
    searchPlaces,
  })
}

const defaultExplorer = createExplorer(true)

function loadJsonc(filepath: string, content: string): Record<string, unknown> | null {
  const errors: ParseError[] = []
  const config = parse(content, errors, { allowTrailingComma: true }) as Record<string, unknown> | null
  const [error] = errors

  if (error) {
    throw new Error(`JSONC Error in ${filepath}: ${printParseErrorCode(error.error)} at offset ${error.offset}`)
  }

  return config ?? null
}

function createTypeScriptLoader(cache: boolean): (filepath: string) => Promise<Record<string, unknown> | null> {
  const jiti = createJiti(import.meta.url, {
    fsCache: cache,
    moduleCache: cache,
  })

  return async (filepath: string) => jiti.import<Record<string, unknown> | null>(filepath, { default: true })
}

/**
 * Loads and resolves an Oxlint configuration file.
 *
 * Discovers the config via cosmiconfig (searching from `cwd` or loading a
 * specific `configFile`), then recursively resolves all `extends` chains.
 *
 * @param options - See {@link GetConfigOptions}.
 * @returns The resolved config with all extensions flattened, or `null` if no config file is found.
 */
export async function getConfig(options: GetConfigOptions = {}): Promise<LoadedOxlintConfig | null> {
  const cwd = options.cwd ?? process.cwd()
  const explorer = options.cache === false ? createExplorer(false) : defaultExplorer
  const result = options.configFile
    ? await explorer.load(path.resolve(cwd, options.configFile))
    : await explorer.search(cwd)

  if (!result || result.isEmpty) {
    return null
  }

  const files = new Set<string>([result.filepath])
  const config = await resolveConfig(
    result.config as ConfigInput,
    result.filepath,
    files,
    new Set([result.filepath]),
    explorer,
  )

  return {
    config,
    files: [...files],
    filepath: result.filepath,
  }
}

/**
 * Recursively resolves a config and all of its `extends`.
 *
 * Extended configs are loaded, filtered to their extendable fields, then
 * merged with the own config (own takes precedence).
 *
 * @param config - The config to resolve (may include an `extends` array).
 * @param filepath - Absolute path to the config file, used as the base for resolving relative `extends` paths.
 * @param files - Accumulator for all config file paths visited throughout the resolution tree.
 * @param resolvingFiles - Tracks in-flight files to detect circular extends.
 * @returns The fully resolved config with all `extends` flattened.
 */
async function resolveConfig(
  config: ConfigInput,
  filepath: string,
  files: Set<string>,
  resolvingFiles: Set<string>,
  explorer: PublicExplorer,
): Promise<ResolvedOxlintConfig> {
  const extendedConfigs = await resolveExtends(config.extends, filepath, files, resolvingFiles, explorer)
  const ownConfig = stripExtends(config)

  return mergeConfigs([...extendedConfigs, ownConfig])
}

/**
 * Loads and resolves all entries in the `extends` array.
 *
 * Each entry is either a file path string (JSON/JSONC config) or an inline config
 * object (TS config). Inline configs are resolved recursively.
 *
 * Returned configs are filtered through {@link pickExtendableConfig} so only
 * inheritable fields survive.
 *
 * @param entries - The `extends` array from a config (string paths or inline config objects).
 * @param filepath - Absolute path to the parent config file, used as the base for resolving relative path strings.
 * @param files - Accumulator for all config file paths visited.
 * @param resolvingFiles - Shared set tracking in-flight files across the entire extends tree. Each extend branch receives a snapshot copy to isolate per-branch cycles.
 * @returns An array of resolved configs with only extendable fields.
 */
async function resolveExtends(
  entries: ConfigInput['extends'],
  filepath: string,
  files: Set<string>,
  resolvingFiles: Set<string>,
  explorer: PublicExplorer,
) {
  if (!entries?.length) {
    return []
  }

  const configs = await Promise.all(
    entries.map(async (entry) => {
      const resolvingBranch = new Set(resolvingFiles)

      if (typeof entry === 'string') {
        return loadJsonLikeConfig(path.resolve(path.dirname(filepath), entry), files, resolvingBranch, explorer)
      }

      return resolveConfig(entry, filepath, files, resolvingBranch, explorer)
    }),
  )

  return configs.map((config) => pickExtendableConfig(config))
}

/**
 * Loads a JSON or JSONC config from disk at the given file path and resolves its
 * `extends` chain.
 *
 * @param filepath - Absolute path to the JSON or JSONC config file to load.
 * @param files - Accumulator for all config file paths visited.
 * @param resolvingFiles - Set tracking in-flight files for cycle detection.
 * @returns The fully resolved config from this file.
 * @throws If a circular extends reference is detected.
 * @throws If the file cannot be loaded by cosmiconfig.
 */
async function loadJsonLikeConfig(
  filepath: string,
  files: Set<string>,
  resolvingFiles: Set<string>,
  explorer: PublicExplorer,
) {
  if (resolvingFiles.has(filepath)) {
    throw new Error(`Circular Oxlint config extends detected: ${filepath}`)
  }

  const result = await explorer.load(filepath)

  if (!result || result.isEmpty) {
    throw new Error(`Unable to load extended Oxlint config: ${filepath}`)
  }

  files.add(result.filepath)
  resolvingFiles.add(result.filepath)

  try {
    return await resolveConfig(result.config as JsonOxlintConfig, result.filepath, files, resolvingFiles, explorer)
  } finally {
    resolvingFiles.delete(result.filepath)
  }
}

/**
 * Returns a shallow copy of the config with the `extends` key removed.
 *
 * The resulting object represents the "own" config (i.e., what this file
 * declares without inherited contributions).
 *
 * @param config - The original config (may include `extends`).
 * @returns A shallow copy of the config without the `extends` property.
 */
function stripExtends(config: ConfigInput): ResolvedOxlintConfig {
  const rest: ConfigInput = { ...config }
  delete rest.extends

  return rest
}

/**
 * Picks only the fields that are inherited through `extends`.
 *
 * Per Oxlint docs, only `rules`, `plugins`, and `overrides` are extendable.
 * Other fields (env, globals, settings, categories, jsPlugins, etc.) are
 * intentionally dropped.
 *
 * If Oxlint changes this behavior, this function must be updated accordingly.
 *
 * @param config - A fully resolved config.
 * @returns A new config object containing only `plugins`, `rules`, and `overrides` (if present in the source).
 * @see https://oxc.rs/docs/guide/usage/linter/nested-config.html#extending-configuration-files
 */
function pickExtendableConfig(config: ResolvedOxlintConfig): ResolvedOxlintConfig {
  const picked: ResolvedOxlintConfig = {}

  if (config.plugins) {
    picked.plugins = config.plugins
  }

  if (config.rules) {
    picked.rules = config.rules
  }

  if (config.overrides) {
    picked.overrides = config.overrides
  }

  return picked
}

/**
 * Merges an ordered list of resolved configs into a single config.
 *
 * The first config serves as the base. Each subsequent config contributes
 * its fields with the following merge strategies:
 *
 * - **plugins**   — concatenated (union of all enabled plugins)
 * - **overrides** — concatenated
 * - **rules**     — cascading override (later entries win on conflict)
 * - **all other** — last-write-wins via {@link Object.assign}
 *
 * @param configs - An ordered list of configs to merge (base first, own config last).
 * @returns A single merged config.
 */
function mergeConfigs(configs: ResolvedOxlintConfig[]) {
  const merged: ResolvedOxlintConfig = {}

  for (const config of configs) {
    const overrides = mergeArrays(merged.overrides, config.overrides)
    const plugins = mergeArrays(merged.plugins, config.plugins)
    const rules = { ...merged.rules, ...config.rules }

    Object.assign(merged, config)
    merged.overrides = overrides
    merged.plugins = plugins
    merged.rules = rules
  }

  return merged
}

/**
 * Concatenates two arrays, handling the case where either is undefined.
 *
 * If both are undefined the result is undefined; if only one is defined it
 * is returned as-is; if both are defined they are concatenated with `base`
 * coming first.
 *
 * @param base - The base array (elements appear first in the result).
 * @param override - The override array (elements appear after the base).
 * @returns The concatenated array, or `undefined` if both inputs are falsy.
 */
function mergeArrays<T>(base: T[] | undefined, override: T[] | undefined) {
  if (!base) {
    return override
  }

  if (!override) {
    return base
  }

  return [...base, ...override]
}
