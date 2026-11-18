import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseRuleMarkdown } from './generate-builtin-rule-docs'

void test('decodes documented scalar string defaults', () => {
  const markdown = [
    '## Configuration',
    '### fn',
    'default: `"test"`',
    '### withinDescribe',
    'default: `"it"`',
    '### location',
    'default: `"start"`',
    '### checksConditionals',
    '#### checksConditionals.flagUnions',
    'default: `"none"`',
  ].join('\n\n')

  assert.deepEqual(parseRuleMarkdown(markdown).defaultOptions, {
    fn: 'test',
    withinDescribe: 'it',
    location: 'start',
    checksConditionals: { flagUnions: 'none' },
  })
})

for (const [name, value, expected] of [
  ['empty string', '""', ''],
  ['string whitespace', '" test "', ' test '],
  ['escaped quotes', String.raw`"say \"hello\""`, 'say "hello"'],
  ['escaped backslash', String.raw`"a\\b"`, String.raw`a\b`],
  ['escaped newline', String.raw`"a\nb"`, 'a\nb'],
  ['unicode escape', String.raw`"\u0074est"`, 'test'],
  ['quoted boolean', '"true"', 'true'],
  ['quoted number', '"42"', '42'],
  ['quoted null', '"null"', 'null'],
  ['true', 'true', true],
  ['false', 'false', false],
  ['null', 'null', null],
  ['integer', '42', 42],
  ['negative decimal', '-1.5', -1.5],
  ['array', '["test", true, 1]', ['test', true, 1]],
  ['object', '{"mode":"test"}', { mode: 'test' }],
  ['bare string', 'always', 'always'],
  ['malformed string', '"unterminated', '"unterminated'],
  ['invalid escape', String.raw`"\q"`, String.raw`"\q"`],
  ['malformed array', '[test]', '[test]'],
  ['malformed object', '{mode: test}', '{mode: test}'],
] as const) {
  void test(`parses ${name} defaults without changing their meaning`, () => {
    assert.deepEqual(parseRuleMarkdown(`## Configuration\n### option\ndefault: \`${value}\``).defaultOptions, {
      option: expected,
    })
  })
}
