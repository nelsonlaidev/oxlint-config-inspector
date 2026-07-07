import { useMemo } from 'react'

import { CodeBlock } from './code-block'

type JsonBlockProps = {
  value: unknown
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function JsonBlock(props: JsonBlockProps) {
  const { value } = props
  const code = useMemo(() => stringifyJson(value), [value])

  return <CodeBlock code={code} lang='json' />
}
