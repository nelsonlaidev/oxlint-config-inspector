# Oxlint Config Inspector

pnpm monorepo with 3 packages orchestrated by Turborepo. Node >=22, pnpm only.

## Toolchain

- **Lint:** `oxlint` (no ESLint)
- **Format:** `oxfmt` (no Prettier)
- **Build (core, cli):** `tsdown` (rolldown-based TS bundler)
- **Build (app):** `vite` with React Compiler babel plugin
- **Typecheck:** `tsc --noEmit` in each package

## Packages

| Package         | Name                            | Purpose                                           |
| --------------- | ------------------------------- | ------------------------------------------------- |
| `packages/core` | `@oxlint-config-inspector/core` | Config loading, rule discovery, plugin resolution |
| `packages/cli`  | `oxlint-config-inspector`       | CLI (yargs): `inspect` and `dev` commands         |
| `packages/app`  | `@oxlint-config-inspector/app`  | React/Vite web UI for browsing config results     |

Dependency order: `core` (no deps) → `cli` (depends on `core`) and `app` (depends on `core`).

## Commands

Run from repo root:

```
pnpm build          # turbo build — core → cli → app
pnpm dev            # turbo dev — starts vite for app, tsdown --watch for core/cli
pnpm lint           # oxlint (LSP-compatible, no auto-fix by default)
pnpm lint:fix       # oxlint --fix
pnpm format         # oxfmt
pnpm format:check   # oxfmt --check
pnpm typecheck      # turbo typecheck — tsc --noEmit in all packages
```

## App dev workflow

The app reads a static `packages/app/public/data.json`. Before running `pnpm dev`, generate it:

```
pnpm build --filter=@oxlint-config-inspector/cli
node packages/cli/bin/oxlint-config-inspector.mjs inspect --output packages/app/public/data.json
```

## Testing

Tests run via Vitest in `packages/core` and `packages/cli`.

```
pnpm test
```

## TSDoc

TSDoc is required only for public APIs: exports intended for package consumers, generated documentation, or cross-package API surfaces. Do not add TSDoc to app-local React components, route modules, or other implementation exports just because they are exported for local composition.

### Format

- Use **multi-line** `/** */` for function-level and type-level TSDoc.

```
/**
 * Loads and resolves an Oxlint configuration file.
 *
 * @param options - See {@link GetConfigOptions}.
 * @returns The resolved config with all extensions flattened.
 */
export async function getConfig(options: GetConfigOptions): Promise<LoadedOxlintConfig> { ... }
```

- Use **single-line** `/** */` for property-level docs inside type definitions.

```ts
export type PluginRuleInfo = {
  /** The rule's own metadata (e.g. schema, deprecation info). */
  meta?: unknown
  /** The fully-qualified rule ID, e.g. `"my-plugin/my-rule"`. */
  ruleId: string
}
```

### Coverage

- Every public API function must have `@param` and `@returns`.
- Every public API type or interface must have a top-level description.
- App-local React components, route modules, module-local helpers, and private functions/types may omit TSDoc unless the logic is non-obvious.

### Tags

- `@param` and `@returns` should be concise. Prefer fitting on a single line even if long.
- When a parameter is an options object, reference its type with `{@link ...}` instead of repeating sub-properties.

```ts
/**
 * @param options - See {@link GetConfigOptions}.
 */
```

- Use `{@link TypeName}` for cross-references to exported types and functions.
- Use `@throws` for functions that throw errors.
- Use `@see` for external documentation links.

## Release workflow

This repository uses [Tegami](https://tegami.fuma-nama.dev) for versioning and publishing.

### Write changelog files

Create pending changelog files under `.tegami/` as `YYYY-MM-DD-{hash}.md`.

See the [changelog format docs](https://tegami.fuma-nama.dev/changelog) for details.

### Example

```md
---
packages:
  npm:@oxlint-config-inspector/core: patch
  npm:oxlint-config-inspector: patch
---

## Fix button hover state

The hover color now matches the design system.
```

### Package references

Use package names, ids, or groups in frontmatter. For example:

- `"@acme/ui"` — package name
- `"npm:@acme/ui"` — package id
- `"group:acme"` — every package in a group

Rules:

- Include YAML frontmatter with `packages`
- Include at least one `#`, `##`, or `###` heading in the body
- Write user-facing release notes under each heading
- Do not edit the publish lock file (`.tegami/publish-lock.yaml`) or package `CHANGELOG.md` files directly
