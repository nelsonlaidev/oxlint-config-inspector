import type { ReactNode } from 'react'

type DetailSectionProps = {
  children: ReactNode
  title: string
}

export function DetailSection(props: DetailSectionProps) {
  const { children, title } = props

  return (
    <section className='space-y-2'>
      <h2 className='font-medium'>{title}</h2>
      {children}
    </section>
  )
}
