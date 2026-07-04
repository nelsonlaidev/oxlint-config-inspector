# @oxlint-config-inspector/core

[![Version](https://img.shields.io/npm/v/@oxlint-config-inspector/core?style=flat&colorA=333333&colorB=000000)](https://npmx.dev/package/@oxlint-config-inspector/core)
[![Downloads](https://img.shields.io/npm/dt/@oxlint-config-inspector/core.svg?style=flat&colorA=333333&colorB=000000)](https://npmx.dev/package/@oxlint-config-inspector/core)
[![License](https://img.shields.io/npm/l/@oxlint-config-inspector/core?style=flat&colorA=333333&colorB=000000)](https://github.com/nelsonlaidev/oxlint-config-inspector/blob/main/LICENSE)

Core config loading and inspection utilities for Oxlint Config Inspector.

This package loads an Oxlint configuration, resolves supported `extends` chains, loads JavaScript plugins, and returns a normalized inspection model for configured, builtin, plugin, and unknown rules.

## Requirements

- Node.js 22 or newer.
- The `oxlint` binary should be available on `PATH` for builtin rule metadata.
  If it is missing, inspection still returns a result, but builtin rules are not
  cataloged and an error is logged.

## Install

```sh
pnpm add @oxlint-config-inspector/core
```

## Usage

```ts
import { inspectConfig } from '@oxlint-config-inspector/core'

const result = await inspectConfig({
  cwd: process.cwd(),
})

if (!result) {
  throw new Error('No Oxlint config found')
}

console.log(result.rules)
```

To inspect a specific config file:

```ts
import { inspectConfig } from '@oxlint-config-inspector/core'

const result = await inspectConfig({
  configFile: 'oxlint.config.ts',
  cwd: process.cwd(),
})
```

## API

### `inspectConfig(options?)`

Loads and inspects an Oxlint config.

Options:

- `cwd`: directory to search from. Defaults to `process.cwd()`.
- `configFile`: explicit config file path, resolved from `cwd`.
- `cache`: whether to cache discovered and loaded config files. Defaults to
  `true`.

Returns `Promise<InspectConfigResult | null>`. `null` means no config file was found.

The result includes:

- `configFilepath`: absolute path to the root config file.
- `generatedAt`: ISO 8601 timestamp for when the inspection result was generated.
- `configFiles`: config files visited while resolving `extends`.
- `plugins`: JavaScript plugins loaded during inspection.
- `pluginErrors`: JavaScript plugin load errors.
- `rules`: builtin, JavaScript plugin, and unknown rules known to the inspector.
- `stats`: aggregate counts for configured, enabled, builtin, plugin, unknown,
  deprecated, recommended, and fixable rules.
- `unknownRules`: configured rules that were not found in the builtin catalog or loaded plugins.

## Config Resolution

The loader searches for:

- `.oxlintrc.json`
- `.oxlintrc.jsonc`
- `oxlint.config.ts`

String `extends` entries are resolved relative to the config file that declares
them. Inline object `extends` entries from TypeScript configs are resolved
recursively. Only Oxlint's extendable fields are inherited from extended files:
`plugins`, `rules`, and `overrides`.

## JavaScript Plugins

`jsPlugins` entries from the root config and override blocks are loaded
dynamically. Plugin load failures are reported in `pluginErrors` instead of
throwing, so a partial inspection result can still be rendered.

## Runtime

This package is ESM-only and requires Node.js 22 or newer.
