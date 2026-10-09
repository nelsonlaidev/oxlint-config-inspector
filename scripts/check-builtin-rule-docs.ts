import { readFileSync } from 'node:fs'

import { xSync } from 'tinyexec'

import { hasBuiltinRuleDocsChanged } from './compare-builtin-rule-docs'

const git = (...args: string[]) => xSync('git', args, { throwOnError: true }).stdout
const file = 'packages/core/src/generated/builtin-rule-docs.ts'

const tracked = git('ls-tree', '--name-only', 'HEAD', '--', file).trim()
const previous = tracked ? git('show', `HEAD:${file}`) : undefined

// A missing generated file is an error, not a metadata-only update.
const current = readFileSync(file, 'utf-8')

const changed = hasBuiltinRuleDocsChanged(previous, current)

process.stdout.write(`changed=${changed}\n`)
