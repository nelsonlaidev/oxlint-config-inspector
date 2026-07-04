import type { ReactNode } from 'react'

type KeyValueProps = {
  label: ReactNode
  value: string
}

export function KeyValue(props: KeyValueProps) {
  const { label, value } = props

  return (
    <div className='grid gap-1 sm:grid-cols-(--key-value-grid-cols,9rem_1fr)'>
      <div className='text-muted-foreground'>{label}</div>
      <div className='min-w-0 font-mono break-all'>{value}</div>
    </div>
  )
}
