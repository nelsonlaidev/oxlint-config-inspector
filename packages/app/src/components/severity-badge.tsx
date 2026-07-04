import type { RuleSeverity } from '@oxlint-config-inspector/core'
import type { ComponentProps } from 'react'

import { Badge } from './ui/badge'

type SeverityBadgeProps = {
  severity: RuleSeverity
}

export function SeverityBadge(props: SeverityBadgeProps) {
  const { severity } = props
  let variant: ComponentProps<typeof Badge>['variant'] = 'secondary'

  if (severity === 'error') {
    variant = 'destructive'
  } else if (severity === 'warn') {
    variant = 'warning'
  } else if (severity === 'off') {
    variant = 'outline'
  }

  return <Badge variant={variant}>{severity}</Badge>
}
