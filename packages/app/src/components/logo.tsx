import { resolveBaseUrlPath } from '@/lib/base-url'
import { cn } from '@/utils/cn'

type LogoProps = React.ComponentProps<'img'>

export function Logo(props: LogoProps) {
  const { className, ...rest } = props

  return (
    <img
      src={resolveBaseUrlPath('favicon.svg')}
      alt='Oxlint Config Inspector'
      className={cn('size-7', className)}
      {...rest}
    />
  )
}
