export function hasBuiltinRuleDocsChanged(previous: string | undefined, current: string): boolean {
  if (previous === undefined) {
    return true
  }

  return withoutVersion(previous) !== withoutVersion(current)
}

function withoutVersion(source: string): string {
  return source.replace(/^\/\/ Oxlint version: [^\r\n]*(?:\r?\n|$)/m, '')
}
