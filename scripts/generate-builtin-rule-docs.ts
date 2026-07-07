import type { RuleInfo } from '../packages/core/src/types'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import pLimit from 'p-limit'
import { x } from 'tinyexec'

import { getOxlintRules } from '../packages/core/src/rules'
import { getBuiltinRuleId } from '../packages/core/src/utils'

const OUTPUT_PATH = path.resolve('packages/core/src/generated/builtin-rule-docs.ts')
const CONCURRENCY = 20

type BuiltinRuleDocOption = {
  default?: unknown
  name: string
}

type BuiltinRuleDocMetadata = {
  defaultOptions?: Record<string, unknown>
  description?: string
}

type RuleDocFetchResult = {
  metadata?: BuiltinRuleDocMetadata
  rule: RuleInfo
  skipped?: string
}

const oxlintRules = await getOxlintRules()
const rules = oxlintRules.filter((rule) => rule.docs_url.length > 0)
const limit = pLimit(CONCURRENCY)
const docResults = await Promise.all(
  rules.map(async (rule, index) =>
    limit(async () => {
      const result = await fetchRuleDoc(rule)

      if ((index + 1) % 50 === 0 || index + 1 === rules.length) {
        process.stdout.write(`Fetched ${index + 1}/${rules.length} rule docs\n`)
      }

      return result
    }),
  ),
)

const metadataByRuleId: Record<string, BuiltinRuleDocMetadata> = {}
const skippedRules: RuleDocFetchResult[] = []

for (const result of docResults) {
  if (!result.metadata) {
    skippedRules.push(result)
    continue
  }

  metadataByRuleId[getBuiltinRuleId(result.rule)] = result.metadata
}

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
await writeFile(OUTPUT_PATH, createGeneratedFile(metadataByRuleId))

await x('oxfmt', [OUTPUT_PATH])

process.stdout.write(`Generated ${Object.keys(metadataByRuleId).length} rule doc metadata entries at ${OUTPUT_PATH}\n`)

if (skippedRules.length > 0) {
  process.stdout.write(`Skipped ${skippedRules.length} rule docs:\n`)

  for (const skipped of skippedRules) {
    process.stdout.write(`- ${getBuiltinRuleId(skipped.rule)}: ${skipped.skipped ?? 'unknown reason'}\n`)
  }
}

async function fetchRuleDoc(rule: RuleInfo): Promise<RuleDocFetchResult> {
  const docsUrl = rule.docs_url
  const markdownUrl = getMarkdownUrl(docsUrl)

  if (!markdownUrl) {
    return {
      rule,
      skipped: 'missing markdown URL',
    }
  }

  try {
    const response = await fetch(markdownUrl)

    if (!response.ok) {
      return {
        rule,
        skipped: `HTTP ${response.status} ${response.statusText}`,
      }
    }

    const markdown = await response.text()
    const metadata = parseRuleMarkdown(markdown)

    return {
      metadata,
      rule,
    }
  } catch (error) {
    return {
      rule,
      skipped: error instanceof Error ? error.message : String(error),
    }
  }
}

function parseRuleMarkdown(markdown: string): BuiltinRuleDocMetadata {
  const description = getFirstParagraph(getSection(markdown, 'What it does'))
  const options = getRuleOptions(getSection(markdown, 'Configuration'))
  const defaultOptions = createDefaultOptions(options)

  return omitUndefined({
    defaultOptions,
    description,
  })
}

function getRuleOptions(section: string | undefined): BuiltinRuleDocOption[] {
  if (!section) {
    return []
  }

  const subsections = getSubsections(section, 3)

  return subsections
    .map(({ body, title }) => {
      const defaultValue = createOptionDefault(body, title)

      return omitUndefined({
        ...(defaultValue === undefined ? {} : { default: defaultValue }),
        name: normalizeOptionName(title),
      })
    })
    .filter((option) => option.default !== undefined)
}

function createOptionDefault(body: string, name: string) {
  const defaultValue = getDirectInlineCodeValue(body, 'default')

  if (defaultValue !== undefined) {
    return parseDefaultValue(defaultValue)
  }

  return createObjectOptionDefault(body, name)
}

function createObjectOptionDefault(body: string, name: string) {
  const entries = getSubsections(body, 4).flatMap(({ body: propertyBody, title }) => {
    const defaultValue = getDirectInlineCodeValue(propertyBody, 'default')

    return defaultValue === undefined
      ? []
      : [[getObjectOptionPropertyName(title, name), parseDefaultValue(defaultValue)] as const]
  })

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function getDirectInlineCodeValue(markdown: string, label: string): string | undefined {
  const lines: string[] = []

  for (const line of markdown.split('\n')) {
    if (getHeading(line)) {
      break
    }

    lines.push(line)
  }

  return getInlineCodeValue(lines.join('\n'), label)
}

function getObjectOptionPropertyName(title: string, optionName: string) {
  const prefix = `${optionName}.`

  return title.startsWith(prefix) ? title.slice(prefix.length) : title
}

function normalizeOptionName(name: string) {
  const match = /^\\?\[(\d+)\]$/.exec(name)

  if (!match) {
    return name
  }

  const optionNumber = Number(match[1]) + 1

  return `The ${formatOrdinal(optionNumber)} option`
}

function formatOrdinal(value: number) {
  const mod100 = value % 100

  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`
  }

  switch (value % 10) {
    case 1: {
      return `${value}st`
    }
    case 2: {
      return `${value}nd`
    }
    case 3: {
      return `${value}rd`
    }
    default: {
      return `${value}th`
    }
  }
}

function createDefaultOptions(options: BuiltinRuleDocOption[]) {
  const entries = options.flatMap((option) =>
    option.default === undefined ? [] : [[option.name, option.default] as const],
  )

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function getSection(markdown: string, title: string): string | undefined {
  const lines = stripFrontmatter(markdown).split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const heading = getHeading(lines[index])

    if (!heading || normalizeHeading(heading.title) !== normalizeHeading(title)) {
      continue
    }

    const body: string[] = []

    for (let bodyIndex = index + 1; bodyIndex < lines.length; bodyIndex += 1) {
      const nextHeading = getHeading(lines[bodyIndex])

      if (nextHeading && nextHeading.level <= heading.level) {
        break
      }

      const line = lines[bodyIndex]

      if (line !== undefined) {
        body.push(line)
      }
    }

    return body.join('\n').trim()
  }

  return undefined
}

function getSubsections(markdown: string, level: number) {
  const lines = markdown.split('\n')
  const subsections: Array<{ body: string; title: string }> = []

  for (let index = 0; index < lines.length; index += 1) {
    const heading = getHeading(lines[index])

    if (!heading || heading.level !== level) {
      continue
    }

    const body: string[] = []

    for (let bodyIndex = index + 1; bodyIndex < lines.length; bodyIndex += 1) {
      const nextHeading = getHeading(lines[bodyIndex])

      if (nextHeading && nextHeading.level <= level) {
        break
      }

      const line = lines[bodyIndex]

      if (line !== undefined) {
        body.push(line)
      }
    }

    subsections.push({
      body: body.join('\n').trim(),
      title: heading.title,
    })
  }

  return subsections
}

function getHeading(line: string | undefined) {
  if (!line?.startsWith('##')) {
    return
  }

  let level = 0

  while (line[level] === '#') {
    level += 1
  }

  if (level < 2 || level > 6 || line[level] !== ' ') {
    return
  }

  const title = line.slice(level + 1).trim()

  if (!title) {
    return
  }

  return {
    level,
    title,
  }
}

function getFirstParagraph(section: string | undefined) {
  if (!section) {
    return
  }

  return removeCodeBlocks(section)
    .split(/\n{2,}/)
    .map((paragraph) => normalizeMarkdownText(paragraph))
    .find(Boolean)
}

function getInlineCodeValue(markdown: string, label: string): string | undefined {
  const labelPrefix = `${label.toLowerCase()}:`

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed.toLowerCase().startsWith(labelPrefix)) {
      continue
    }

    const firstBacktick = trimmed.indexOf('`')
    const secondBacktick = trimmed.indexOf('`', firstBacktick + 1)

    if (firstBacktick === -1 || secondBacktick === -1) {
      return
    }

    return trimmed.slice(firstBacktick + 1, secondBacktick).trim()
  }

  return undefined
}

function normalizeMarkdownText(markdown: string | undefined) {
  if (!markdown) {
    return
  }

  return markdown
    .split('\n')
    .map((line) => removeInlineMarkdown(line).trim())
    .filter((line) => line.length > 0)
    .join(' ')
}

function removeInlineMarkdown(markdown: string) {
  return replaceMarkdownLinks(markdown).replaceAll('`', '').replaceAll('**', '').replaceAll('*', '')
}

function replaceMarkdownLinks(markdown: string) {
  let output = ''
  let remaining = markdown

  while (remaining.length > 0) {
    const labelStart = remaining.indexOf('[')
    const labelEnd = remaining.indexOf('](', labelStart + 1)

    if (labelStart === -1 || labelEnd === -1) {
      output += remaining
      break
    }

    const linkEnd = remaining.indexOf(')', labelEnd + 2)

    if (linkEnd === -1) {
      output += remaining
      break
    }

    output += remaining.slice(0, labelStart)
    output += remaining.slice(labelStart + 1, labelEnd)
    remaining = remaining.slice(linkEnd + 1)
  }

  return output
}

function removeCodeBlocks(markdown: string) {
  const lines = markdown.split('\n')
  const keptLines: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (!inCodeBlock) {
      keptLines.push(line)
    }
  }

  return keptLines.join('\n')
}

function normalizeHeading(heading: string) {
  return heading.trim().toLowerCase()
}

function parseDefaultValue(value: string): unknown {
  const trimmed = value.trim()

  if (trimmed === 'true') {
    return true
  }

  if (trimmed === 'false') {
    return false
  }

  if (trimmed === 'null') {
    return null
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }

  return trimmed
}

function stripFrontmatter(markdown: string) {
  if (!markdown.startsWith('---\n')) {
    return markdown
  }

  const frontmatterEnd = markdown.indexOf('\n---', 4)

  if (frontmatterEnd === -1) {
    return markdown
  }

  const contentStart = frontmatterEnd + '\n---'.length

  return markdown.slice(markdown[contentStart] === '\n' ? contentStart + 1 : contentStart)
}

function getMarkdownUrl(url: string): string | undefined {
  if (url.endsWith('.html')) {
    return `${url.slice(0, -'.html'.length)}.md`
  }

  if (url.endsWith('.md')) {
    return url
  }

  return undefined
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as T
}

function createGeneratedFile(metadataByRuleId: Record<string, BuiltinRuleDocMetadata>) {
  return `\
// oxlint-disable eslint/no-template-curly-in-string
// This file is generated by scripts/generate-builtin-rule-docs.ts.
// Do not edit this file manually.

export type BuiltinRuleDocMetadata = {
  defaultOptions?: Record<string, unknown>
  description?: string
}

export const builtinRuleDocs: Record<string, BuiltinRuleDocMetadata> = ${JSON.stringify(metadataByRuleId, null, 2)} as const
`
}
