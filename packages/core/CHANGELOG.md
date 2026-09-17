## @oxlint-config-inspector/core@1.1.3

### Discover rules for standalone configs in Vite+ projects

Use `vp lint --rules` when Vite+ is installed in the inspected workspace, including when inspecting a nested `oxlint.config.ts`. This avoids invoking Vite+'s LSP-only `oxlint` wrapper and returning an empty builtin rule catalog.

Resolve the Vite+ CLI from the inspected workspace and run it in that directory, so inspecting another workspace with `--cwd` also works when its `vp` is not on PATH.

## @oxlint-config-inspector/core@1.1.2

### Refresh builtin rule documentation metadata

Builtin rule descriptions and documented default options are regenerated against the Oxlint 1.83.0 rule set. New rules such as `react/hooks`, `react/purity`, `eslint/id-denylist`, and `eslint/one-var` are now cataloged, the `react/react-compiler` rule was replaced by a set of granular React Compiler rules, and several documented defaults were corrected.

### Update dependencies

Internal dependencies were updated, including `cosmiconfig` 10, `tinyexec` 1.3, `vite-plus` 0.3, and `yargs` 18.1.

### Show override-level JS plugins in the Overrides tab

Override blocks that declare `jsPlugins` now display those plugins in the Overrides tab and include them in the plugin count. JS plugin names are resolved by their declaration key, so the same specifier loaded under multiple aliases no longer resolves to the wrong name, and plugins that fail to load fall back to their alias or specifier.

## @oxlint-config-inspector/core@1.1.1

### Include Oxlint default plugins

Empty configurations now report correctness rules from TypeScript, Unicorn, and Oxc as warnings, matching Oxlint's default plugin set.

## @oxlint-config-inspector/core@1.1.0

### Read Oxlint config from Vite+ `vite.config.ts`

You can now inspect Oxlint rules and plugins defined in a Vite+ `vite.config.ts` `lint` block. When the block is absent, a dedicated Oxlint config file is used as fallback.

## @oxlint-config-inspector/core@1.0.0

### Initial beta release

### Remove `searchText` from `InspectedRule`

The `searchText` field has been removed from the `InspectedRule` type. Search consumers should index individual fields (`ruleId`, `name`, `pluginName`, `category`, `description`, `source`, `ruleType`, `aliases`, `replacedBy`) directly instead of relying on the pre-flattened aggregate string.

### Add builtin rule documentation metadata

Builtin Oxlint rules now include generated documentation metadata in inspection results, including rule descriptions and documented default option values. The inspector UI now shows default options alongside configured options so rule settings are easier to compare with their documented defaults.

The generated metadata also handles nested option objects and normalizes zero-based option headings like `[1]` into ordinal labels such as `The 2nd option`.

## @oxlint-config-inspector/core@1.0.0-beta.2 (beta)

### Remove `searchText` from `InspectedRule`

The `searchText` field has been removed from the `InspectedRule` type. Search consumers should index individual fields (`ruleId`, `name`, `pluginName`, `category`, `description`, `source`, `ruleType`, `aliases`, `replacedBy`) directly instead of relying on the pre-flattened aggregate string.

### Add builtin rule documentation metadata

Builtin Oxlint rules now include generated documentation metadata in inspection results, including rule descriptions and documented default option values. The inspector UI now shows default options alongside configured options so rule settings are easier to compare with their documented defaults.

The generated metadata also handles nested option objects and normalizes zero-based option headings like `[1]` into ordinal labels such as `The 2nd option`.

## @oxlint-config-inspector/core@1.0.0-beta.0 (beta)

### Initial beta release
