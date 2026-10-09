import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hasBuiltinRuleDocsChanged } from './compare-builtin-rule-docs'

const docs =
  '// Generated file\n// Oxlint version: 1.86.0\nexport const docs = { description: "Old docs", defaultOptions: { mode: "old" } }\n'

for (const [name, current, expected] of [
  ['identical content', docs, false],
  ['version comment only', docs.replace('1.86.0', '1.87.0'), false],
  ['description only', docs.replace('Old docs', 'New docs'), true],
  ['description and version', docs.replace('1.86.0', '1.87.0').replace('Old docs', 'New docs'), true],
  ['default options', docs.replace('mode: "old"', 'mode: "new"'), true],
  ['other comments', docs.replace('// Generated file', '// Changed header'), true],
  ['version text in docs', docs.replace('Old docs', '// Oxlint version: 1.87.0'), true],
] as const) {
  void test(name, () => {
    assert.equal(hasBuiltinRuleDocsChanged(docs, current), expected)
  })
}
