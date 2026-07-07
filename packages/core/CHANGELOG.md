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
