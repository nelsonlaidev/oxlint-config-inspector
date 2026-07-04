import { LoaderIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

type SpinnerProps = React.ComponentProps<'svg'>

export function Spinner(props: SpinnerProps) {
  const { className, ...rest } = props

  return (
    <LoaderIcon
      data-slot='spinner'
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role='status'
      aria-label='Loading'
      className={cn('size-4 animate-spin', className)}
      {...rest}
    />
  )
}
