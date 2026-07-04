import type { InspectedRule } from '@oxlint-config-inspector/core'

import { Badge } from './ui/badge'

type SourceBadgeProps = {
  source: InspectedRule['source']
}

export function SourceBadge(props: SourceBadgeProps) {
  const { source } = props

  return <Badge variant={source === 'unknown' ? 'destructive' : 'outline'}>{source}</Badge>
}
