import type { ReactNode } from 'react'

type MutedTextProps = {
  children: ReactNode
}

export function MutedText(props: MutedTextProps) {
  const { children } = props

  return <p className='text-sm text-muted-foreground'>{children}</p>
}
