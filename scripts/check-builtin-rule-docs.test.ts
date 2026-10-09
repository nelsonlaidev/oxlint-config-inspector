import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { xSync } from 'tinyexec'

const script = fileURLToPath(new URL('check-builtin-rule-docs.ts', import.meta.url))
const file = 'packages/core/src/generated/builtin-rule-docs.ts'
const docs =
  '// Generated file\n// Oxlint version: 1.86.0\nexport const docs = { description: "Old docs", defaultOptions: { mode: "old" } }\n'

for (const [name, previous, current, expected] of [
  ['compares HEAD with the working file', docs, docs.replace('1.86.0', '1.87.0'), 'changed=false\n'],
  ['reports changed working content', docs, docs.replace('Old docs', 'New docs'), 'changed=true\n'],
  ['new untracked file', undefined, docs, 'changed=true\n'],
  ['missing generated file', docs, undefined, undefined],
  ['both files missing', undefined, undefined, undefined],
] as const) {
  void test(name, () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'builtin-docs-'))
    const git = (...args: string[]) => xSync('git', args, { throwOnError: true, nodeOptions: { cwd } })

    try {
      git('init', '--quiet')
      mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })

      if (previous !== undefined) {
        writeFileSync(path.join(cwd, file), previous)
        git('add', file)
      }

      git(
        '-c',
        'user.name=Test User',
        '-c',
        'user.email=test@example.invalid',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'Fixture',
      )

      if (current === undefined) {
        rmSync(path.join(cwd, file), { force: true })
      } else {
        writeFileSync(path.join(cwd, file), current)
      }

      const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), script], {
        cwd,
        encoding: 'utf-8',
      })

      if (expected === undefined) {
        assert.notEqual(result.status, 0)
        assert.equal(result.stdout, '')
        assert.match(result.stderr, /ENOENT/)
      } else {
        assert.equal(result.status, 0, result.stderr)
        assert.equal(result.stdout, expected)
      }
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
}
