type JsonBlockProps = {
  value: unknown
}

export function JsonBlock(props: JsonBlockProps) {
  const { value } = props

  return (
    <pre className='max-h-96 overflow-auto border bg-muted/40 p-3 text-sm'>
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  )
}
